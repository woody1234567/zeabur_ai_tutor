# Teacher AI Chat 實作計畫

## 背景

Student 端已有 AI Chat 功能（`app/pages/student/ai-chat.vue`），使用 SSE streaming + OpenAI SDK + tool calling（search_problems, recommend_materials）。現在需要在 Teacher 端加入類似的 AI Chat，但提供**不同的工具組**——AI 可以協助老師來回討論題目，最終將題目寫入 `problems` 資料表。

## 架構設計

複用現有的 `streamChat()` 基礎設施（`server/utils/ai-chat.ts`），使其支援 role-aware 的工具選擇與 system prompt。新建 `teacherChatHistory` DB 表，避免影響 student chat。

---

## 實作狀態

### 1. ✅ DB Schema — `teacherChatHistory` 資料表

**檔案：** `db/schema.ts`

已在 `chatHistory` 後新增 `teacherChatHistory` 表，包含 `teacherId`（FK → user.id）、`title`、`messages`（jsonb）、`createdAt`、`updatedAt`。

**Migration：** `drizzle/0002_right_phantom_reporter.sql`（已產生，需執行 `pnpm db:migrate` 套用）

### 2. ✅ AI Tool — `create-problem.ts`

**新檔案：** `server/utils/ai-tools/create-problem.ts`

- Zod input schema：title, content, choices（record 格式 `{"A":"...","B":"..."}`）, correctAnswer, explanation, difficulty, subject, chapter, grade, source, hashtags
- Handler：驗證 correctAnswer 存在於 choices 中，插入 `problems` 表，回傳 `{ success, message, problem: { id, title, createdAt } }`
- Description 使用中文，引導 AI 在老師確認題目內容後才呼叫

### 3. ✅ 重構 `ai-tools/index.ts` — 依角色選擇工具

**檔案：** `server/utils/ai-tools/index.ts`

- `studentTools = [searchProblemsTool, recommendMaterialsTool]`
- `teacherTools = [searchProblemsTool, createProblemTool]`
- `getOpenAITools(role)` 依 role 回傳對應工具組
- `executeAiTool()` 使用 Map 去重後合併所有工具查找

### 4. ✅ 重構 `ai-chat.ts` — Role-aware streaming

**檔案：** `server/utils/ai-chat.ts`

- `StreamChatOptions` 新增 `role?: "student" | "teacher"`
- 原 `buildSystemPrompt` 改名為 `buildStudentSystemPrompt`
- 新增 `buildTeacherSystemPrompt(userId)`：
  - AI 扮演出題協作助手
  - 可搜尋現有題庫、建立新題目
  - 只在老師確認後才呼叫 `create_problem`
  - 使用與老師相同的語言回覆
- `streamChat()` 依 `role` 選擇 system prompt 和工具組

### 5. ✅ 後端 — Teacher chat API

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `server/api/teacher/chat.post.ts` | ✅ 新增 | SSE streaming，使用 `teacherChatHistory`，`role: "teacher"` |
| `server/api/teacher/chats/index.get.ts` | ✅ 新增 | 列出老師的對話紀錄（按 updatedAt 降序） |
| `server/api/teacher/chats/[id].get.ts` | ✅ 新增 | 取得單一對話（驗證 teacherId 所有權） |

所有端點皆包含 `requireAuthSession()` + role 驗證（teacher 或 admin）。

### 6. ✅ 前端 — Teacher AI Chat 頁面

**新檔案：** `app/pages/teacher/ai-chat.vue`

- `layout: "teacher"`
- API 端點：`/api/teacher/chat`、`/api/teacher/chats`
- 完整 SSE streaming 支援（token、tool_start、tool_result、done、chat_id 事件）
- 左側 sidebar 顯示對話紀錄，支援新建/載入對話
- 使用 `MarkdownRenderer` 渲染 AI 回覆
- i18n key：`teacher.chat.*`

### 7. ✅ Teacher Layout — 新增導覽連結

**檔案：** `app/layouts/teacher.vue`

- Desktop navbar：在 Materials 和 ThemeSwitcher 之間加入 "AI Assistant" 連結
- Mobile sidebar：在 "Create Problem" 之後加入 "AI Assistant" 連結
- i18n key：`teacher.layout.ai_chat`

### 8. ✅ i18n — 新增翻譯

**檔案：** `i18n/locales/en.json`、`i18n/locales/zhTW.json`

已新增的 key：

| Key | en | zhTW |
|-----|-----|------|
| `teacher.layout.ai_chat` | AI Assistant | AI 助手 |
| `teacher.chat.new_chat` | New Chat | 新對話 |
| `teacher.chat.placeholder` | Describe the problem you want to create... | 描述你想建立的題目... |
| `teacher.chat.send` | Send | 送出 |
| `teacher.chat.start_prompt` | Start a conversation to create or discuss problems with AI | 開始與 AI 討論並建立題目 |
| `teacher.chat.header_ai` | AI Assistant | AI 助手 |
| `teacher.chat.header_user` | You | 你 |
| `teacher.chat.error_response` | An error occurred, please try again. | 發生錯誤，請重試。 |
| `teacher.chat.tool_running` | Running tool | 正在執行工具 |

---

## 影響檔案清單

| 檔案 | 異動類型 | 狀態 |
|------|---------|------|
| `db/schema.ts` | 修改 — 新增 `teacherChatHistory` 表 | ✅ |
| `drizzle/0002_right_phantom_reporter.sql` | **自動產生** — migration | ✅ |
| `server/utils/ai-tools/create-problem.ts` | **新增** — AI tool 包裝器 | ✅ |
| `server/utils/ai-tools/index.ts` | 修改 — role-based 工具選擇 | ✅ |
| `server/utils/ai-chat.ts` | 修改 — 新增 role 參數、teacher system prompt | ✅ |
| `server/api/teacher/chat.post.ts` | **新增** — SSE streaming 端點 | ✅ |
| `server/api/teacher/chats/index.get.ts` | **新增** — 列出對話 | ✅ |
| `server/api/teacher/chats/[id].get.ts` | **新增** — 取得對話 | ✅ |
| `app/pages/teacher/ai-chat.vue` | **新增** — Teacher chat 頁面 | ✅ |
| `app/layouts/teacher.vue` | 修改 — 新增導覽連結 | ✅ |
| `i18n/locales/en.json` | 修改 — 新增 teacher.chat + teacher.layout.ai_chat | ✅ |
| `i18n/locales/zhTW.json` | 修改 — 同上（中文翻譯） | ✅ |

## 驗證結果

| 驗證項目 | 狀態 |
|---------|------|
| `pnpm db:generate` — 產生 migration | ✅ `0002_right_phantom_reporter.sql` |
| `pnpm db:migrate` — 套用至資料庫 | ⏳ 待執行 |
| TypeScript type check — 無新增錯誤 | ✅ 僅有既存錯誤 |
| JSON locale 驗證 — en.json / zhTW.json | ✅ 合法 JSON |
| 啟動 dev server 實際測試 | ⏳ 待測試 |

## 待辦

1. 執行 `pnpm db:migrate` 套用 migration
2. 啟動 dev server，以 teacher 身份登入測試完整流程
3. 確認 SSE streaming、tool calling（search_problems + create_problem）正常運作
