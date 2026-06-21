# Teacher AI Chat 實作計畫

## 背景

Student 端已有 AI Chat 功能（`app/pages/student/ai-chat.vue`），使用 SSE streaming + OpenAI SDK + tool calling（search_problems, recommend_materials）。現在需要在 Teacher 端加入類似的 AI Chat，但提供**不同的工具組**——AI 可以協助老師來回討論題目，最終將題目寫入 `problems` 資料表。

## 架構設計

複用現有的 `streamChat()` 基礎設施（`server/utils/ai-chat.ts`），使其支援 role-aware 的工具選擇與 system prompt。新建 `teacherChatHistory` DB 表，避免影響 student chat。

---

## 實作步驟

### 1. DB Schema — `teacherChatHistory` 資料表

**檔案：** `db/schema.ts`

在 `chatHistory` 後新增：

```ts
export const teacherChatHistory = pgTable("teacher_chat_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => user.id),
  title: text("title"),
  messages: jsonb("messages")
    .$type<{ role: "user" | "assistant"; content: string }[]>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

完成後執行 `pnpm db:generate` 產生 migration。

### 2. AI Tool — `create-problem.ts`

**新檔案：** `server/utils/ai-tools/create-problem.ts`

建立 `AiToolDefinition` 包裝器，複用 `server/mcp/tools/create_problem.ts` 的 DB 寫入邏輯：

- 使用相同的 Zod input schema（title, content, choices, correctAnswer, explanation, difficulty, subject, chapter, grade, source, hashtags）
- Handler：驗證 correctAnswer 存在於 choices 中，插入 `problems` 表，回傳建立的 problem ID + title
- Description 使用中文（與 `search-problems.ts` 風格一致），引導 AI 在老師確認後才呼叫此工具

### 3. 重構 `ai-tools/index.ts` — 依角色選擇工具

**檔案：** `server/utils/ai-tools/index.ts`

目前硬編碼 `aiTools = [searchProblemsTool, recommendMaterialsTool]`。改為：

```ts
const studentTools = [searchProblemsTool, recommendMaterialsTool];
const teacherTools = [searchProblemsTool, createProblemTool];

export function getOpenAITools(role: "student" | "teacher" = "student") {
  const tools = role === "teacher" ? teacherTools : studentTools;
  return tools.map(toOpenAITool);
}

export async function executeAiTool(name, args, context) {
  const allTools = [...new Map([...studentTools, ...teacherTools].map(t => [t.name, t])).values()];
  const tool = allTools.find(t => t.name === name);
  // ...
}
```

### 4. 重構 `ai-chat.ts` — Role-aware streaming

**檔案：** `server/utils/ai-chat.ts`

變更：
- `StreamChatOptions` 新增 `role?: "student" | "teacher"`
- 新增 `buildTeacherSystemPrompt(userId)` — AI 作為出題協作助手
- 將 `role` 傳給 `getOpenAITools(role)`

Teacher system prompt 重點：
- 扮演出題協作助手，協助老師構思、精煉、儲存選擇題
- 可搜尋現有題庫作為參考/避免重複
- 只在老師確認題目內容後才呼叫 `create_problem` 工具
- 使用與老師相同的語言回覆

### 5. 後端 — Teacher chat API

建立 3 個新檔案，沿用 student chat 的模式：

| 檔案 | 用途 |
|------|------|
| `server/api/teacher/chat.post.ts` | SSE streaming 端點，使用 `teacherChatHistory`，`role: "teacher"` |
| `server/api/teacher/chats/index.get.ts` | 列出老師的對話紀錄 |
| `server/api/teacher/chats/[id].get.ts` | 取得單一對話 |

Auth：`requireAuthSession()` + 驗證 role 為 teacher 或 admin。

### 6. 前端 — Teacher AI Chat 頁面

**新檔案：** `app/pages/teacher/ai-chat.vue`

從 `app/pages/student/ai-chat.vue` 複製並修改：
- `layout: "teacher"`
- API 端點改為 `/api/teacher/chat`、`/api/teacher/chats`
- i18n key 改為 `teacher.chat.*`
- 其他 SSE 處理、MarkdownRenderer 用法不變

### 7. Teacher Layout — 新增導覽連結

**檔案：** `app/layouts/teacher.vue`

在 desktop navbar 和 mobile sidebar 都加入「AI 助手」連結：
- Desktop：在 ThemeSwitcher 之前加 `<li>`，連結到 `/teacher/ai-chat`
- Mobile sidebar：在 "Create Problem" 之後加 `<li>`
- i18n key：`teacher.layout.ai_chat`

### 8. i18n — 新增翻譯

**檔案：** `i18n/locales/en.json`、`i18n/locales/zhTW.json`

在 `teacher` 下新增：

```json
"chat": {
  "new_chat": "New Chat / 新對話",
  "placeholder": "Describe the problem you want to create... / 描述你想建立的題目...",
  "send": "Send / 送出",
  "start_prompt": "Start a conversation to create problems with AI / 開始與 AI 討論並建立題目",
  "header_ai": "AI Assistant / AI 助手",
  "header_user": "You / 你",
  "error_response": "An error occurred / 發生錯誤，請重試",
  "tool_running": "Running tool / 正在執行工具"
}
```

在 `teacher.layout` 新增：`"ai_chat": "AI Assistant / AI 助手"`

---

## 影響檔案清單

| 檔案 | 異動類型 |
|------|---------|
| `db/schema.ts` | 修改 — 新增 `teacherChatHistory` 表 |
| `server/utils/ai-tools/create-problem.ts` | **新增** — AI tool 包裝器 |
| `server/utils/ai-tools/index.ts` | 修改 — role-based 工具選擇 |
| `server/utils/ai-chat.ts` | 修改 — 新增 role 參數、teacher system prompt |
| `server/api/teacher/chat.post.ts` | **新增** — SSE streaming 端點 |
| `server/api/teacher/chats/index.get.ts` | **新增** — 列出對話 |
| `server/api/teacher/chats/[id].get.ts` | **新增** — 取得對話 |
| `app/pages/teacher/ai-chat.vue` | **新增** — Teacher chat 頁面 |
| `app/layouts/teacher.vue` | 修改 — 新增導覽連結 |
| `i18n/locales/en.json` | 修改 — 新增 teacher.chat + teacher.layout.ai_chat |
| `i18n/locales/zhTW.json` | 修改 — 同上（中文翻譯） |

## 驗證方式

1. `pnpm db:generate` → 確認產生 migration
2. `pnpm db:migrate` → 套用至資料庫
3. TypeScript type check 通過
4. 啟動 dev server，以 teacher 身份登入
5. 從導覽列進入 AI Chat 頁面
6. 測試：發送訊息，確認 SSE streaming 正常
7. 測試：請 AI 搜尋現有題目，確認 search_problems tool 正常
8. 測試：與 AI 討論一道題目，確認後讓 AI 建立，驗證 problems 表中有新資料
9. 測試：對話紀錄 sidebar — 新建對話、載入既有對話
10. 測試：切換至 zhTW，確認所有標籤正確顯示
