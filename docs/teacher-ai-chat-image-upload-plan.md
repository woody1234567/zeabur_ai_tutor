# Teacher AI Chat — 圖片上傳 + AI 引導出題功能計畫

## Context

現有的 Teacher AI Chat（`app/pages/teacher/ai-chat.vue`）已支援文字對話、SSE streaming、tool calling（search_problems + create_problem）。本次新增功能讓教師可以**直接在聊天中上傳題目圖片**，AI 會辨識圖片內容、主動詢問缺少的題目資訊（chapter、difficulty、grade 等），產生題目詳解，在教師確認後才寫入資料庫。AI 生成的題目會在 DB 中標記，以便事後人工檢驗。

此外，AI 會在確認流程中主動詢問教師「此題是否需要圖片才能完整表達題意」（如幾何圖形、圖表等），若需要則請教師上傳題目內容圖片，該圖片會作為 `problems.imageUrl` 存入題目資料庫。

---

## 影響範圍分析

### 需修改的既有檔案

| 檔案 | 影響說明 |
|------|---------|
| `db/schema.ts` | `problems` 表新增 `aiGenerated`、`createdBy` 欄位 |
| `server/utils/ai-chat.ts` | `StreamChatOptions` 型別擴展支援 `imageUrl`；teacher system prompt 加入圖片辨識 + 題目內容圖片詢問 + 確認工作流指引 |
| `server/api/teacher/chat.post.ts` | 接收 `imageUrl` 參數，組裝多模態 OpenAI 訊息，歷史訊息中保存 imageUrl |
| `server/utils/ai-tools/create-problem.ts` | 新增 `imageUrl` 參數，自動設定 `aiGenerated: true`、`createdBy: context.userId` |
| `app/pages/teacher/ai-chat.vue` | 加入圖片上傳 UI、圖片預覽、聊天氣泡中顯示圖片 |
| `i18n/locales/en.json` | 新增 `teacher.chat.upload_image` 等 6 個 key |
| `i18n/locales/zhTW.json` | 同上（中文翻譯） |

### 不受影響的既有功能

| 檔案 / 功能 | 原因 |
|------------|------|
| `app/pages/student/ai-chat.vue` | 學生端不需要圖片上傳，`streamChat` 的 student 路徑不受影響 |
| `server/api/teacher/upload.post.ts` | 直接複用，不需修改 |
| `server/utils/r2.ts` | 直接複用 |
| `server/utils/ai-tools/index.ts` | 不需新增 tool，只修改既有 `create-problem` |
| `server/utils/ai-tools/types.ts` | `AiToolContext` 已有 `userId`，不需修改 |
| `server/utils/ai-tools/search-problems.ts` | 不受影響 |
| `server/api/teacher/chats/[id].get.ts` | 回傳完整 JSONB，自動包含新增的 `imageUrl` 欄位 |
| `server/api/teacher/chats/index.get.ts` | 不受影響 |
| `server/api/problems/index.get.ts` | 查詢端可選擇性加入 `aiGenerated` 篩選，但非必要 |
| `app/components/MarkdownRenderer.vue` | 圖片在聊天氣泡層級渲染，不需改 Markdown renderer |
| `app/components/teacher/VisionTool.vue` | 保持獨立，僅參考其 FileReader 模式 |

### 需新增的檔案

| 檔案 | 說明 |
|------|------|
| `drizzle/0003_lowly_supernaut.sql` | 自動產生的 migration（`aiGenerated`、`createdBy` 欄位） |

---

## 實作狀態

### Step 1: ✅ DB Migration — problems 表新增欄位

**檔案：** `db/schema.ts`

在 `problems` 表新增：
```ts
aiGenerated: boolean("ai_generated").default(false),
createdBy: text("created_by").references(() => user.id),
```

**Migration：** `drizzle/0003_lowly_supernaut.sql`（已產生，需執行 `pnpm db:migrate` 套用）

### Step 2: ✅ 更新 create-problem tool

**檔案：** `server/utils/ai-tools/create-problem.ts`

變更：
- Zod schema 新增 `imageUrl` 參數
- insert values 加入 `aiGenerated: true`、`createdBy: context.userId`、`imageUrl: parsed.imageUrl`

### Step 3: ✅ 擴展 streamChat 支援多模態訊息

**檔案：** `server/utils/ai-chat.ts`

變更：
1. `StreamChatOptions` 新增 `imageUrl?: string`
2. 建構 user message 時，若有 `imageUrl`，組裝為 OpenAI 多模態格式（text + image_url with `detail: "high"`）
3. 強化 teacher system prompt：
   - 圖片辨識：辨識上傳的考卷/教材圖片內容
   - 資訊收集：主動詢問缺少的 chapter / difficulty / grade / subject
   - 題目內容圖片：主動詢問教師「此題是否需要圖片才能完整表達題意」，若需要請教師上傳
   - 確認流程：整理完整草稿後請教師確認，確認後才呼叫 create_problem
   - imageUrl 傳遞：將教師上傳的題目內容圖片 URL 帶入 create_problem 的 imageUrl 參數

### Step 4: ✅ 更新 teacher chat API

**檔案：** `server/api/teacher/chat.post.ts`

變更：
1. 從 body 接收 `imageUrl`（可選）
2. 傳給 `streamChat` 時帶入 `imageUrl`
3. 保存到 `teacherChatHistory.messages` 時，user message 帶 `imageUrl`
4. 重建歷史訊息時，含 `imageUrl` 的訊息組裝為多模態格式

### Step 5: ✅ 前端 — 圖片上傳 UI

**檔案：** `app/pages/teacher/ai-chat.vue`

變更：
1. 訊息型別擴展為 `ChatMessage`（含 `imageUrl?`）
2. 新增 `pendingImage`、`pendingImagePreview`、`isUploading` 狀態
3. 輸入區加圖片上傳按鈕（隱藏 file input + 圖片 icon 按鈕）
4. 圖片預覽條（附移除按鈕）
5. 送出時先上傳 R2 取得 URL，再 POST chat API
6. 聊天氣泡中顯示 `msg.imageUrl` 圖片
7. 20MB 大小限制檢查

### Step 6: ✅ i18n 新增翻譯

| Key | en | zhTW |
|-----|-----|------|
| `teacher.chat.upload_image` | Upload Image | 上傳圖片 |
| `teacher.chat.uploading` | Uploading... | 上傳中... |
| `teacher.chat.upload_failed` | Image upload failed | 圖片上傳失敗 |
| `teacher.chat.image_too_large` | Image must be under 20MB | 圖片須小於 20MB |
| `teacher.chat.remove_image` | Remove image | 移除圖片 |
| `teacher.chat.image_attached` | Image attached | 已附加圖片 |

---

## 資料流

```
教師上傳考卷圖片 + 文字「幫我辨識這張考卷第3題」
    ↓
前端選擇檔案 → FormData POST /api/teacher/upload → R2 → 取得 imageUrl
    ↓
POST /api/teacher/chat { message, imageUrl, chatId }
    ↓
chat.post.ts 組裝多模態 OpenAI content (text + image_url)
    ↓
ai-chat.ts → OpenAI Vision (gpt-4o) 辨識圖片文字
    ↓
AI 回覆：「辨識結果是…，缺少 chapter 和 difficulty，請問是？」
    ↓
教師：「高一數學，第三章，中等難度」
    ↓
AI：「此題是否需要圖片才能完整表達？（如幾何圖形、圖表等）」
    ↓
教師上傳題目內容圖片 → R2 → AI 記住此 imageUrl
    ↓
AI 整理完整草稿呈現（含圖片標註）
    ↓
教師：「確認，請建立」
    ↓
AI 呼叫 create_problem tool（帶 imageUrl、aiGenerated: true、createdBy）
    ↓
資料庫寫入，回報結果
```

---

## 驗證方式

1. **DB migration**：`pnpm db:generate && pnpm db:migrate` 成功
2. **基本聊天**：純文字訊息 streaming + tool calling 仍正常
3. **圖片上傳流程**：選擇圖片 → 預覽 → 送出 → R2 上傳 → AI 辨識回覆 → 氣泡顯示圖片
4. **AI 引導確認流程**：上傳考卷圖片但不提供 chapter/difficulty → AI 主動詢問 → AI 詢問是否需要題目內容圖片 → 確認後建立 → DB 中 `ai_generated = true`、`created_by` 有值
5. **歷史對話圖片**：重新載入含圖片的對話，圖片仍可顯示
6. **向後相容**：載入舊的純文字對話，正常顯示無報錯

## 待辦

1. 執行 `pnpm db:migrate` 套用 migration
2. 啟動 dev server，以 teacher 身份登入測試完整流程
