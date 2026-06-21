# AI Chat 改善計畫：移除 Python AI Service，改用 Nuxt 原生 OpenAI SDK + MCP Toolkit

## Context

目前 ai-chat 頁面透過 Python FastAPI + LangGraph 微服務處理 AI 對話，該服務再透過 SSE 連接 Nuxt MCP server 取得工具。這個架構有幾個問題：
1. 額外維護一個 Python 服務，部署複雜度高
2. MCP auth 依賴 Open-WebUI headers，不適用於直接使用 ai-chat.vue 的場景
3. 無法支援未來的 MCP Apps（互動式 UI）——tool 的 structuredContent 會被 Python 服務吞掉

**目標**：用 Nuxt 原生方案取代 Python AI service，使用 Hermes Agent 作為 OpenAI-compatible LLM provider，Nuxt 自己編排 tool calling loop，保留 MCP role-based auth。

## 架構變更

```
Before:  ai-chat.vue → chat.post.ts → Python FastAPI → Nuxt MCP Server
After:   ai-chat.vue → chat.post.ts → [Hermes LLM API + 本地 MCP tool 執行]
```

## 實作步驟

### Step 1：新增環境變數

在 `nuxt.config.ts` 的 `runtimeConfig` 新增：
- `aiBaseUrl`：Hermes Agent API base URL（預設 `http://localhost:8000/v1`）
- `aiModel`：模型名稱（預設 `hermes`）

### Step 2：建立 AI chat service（server-side utility）

新增 `server/utils/ai-chat.ts`：
- 使用既有的 `openai` npm 套件（已安裝），指向 Hermes 的 `baseURL`
- 實作 tool calling loop：
  1. 將 MCP student tools 轉換為 OpenAI function definitions
  2. 呼叫 Hermes `/v1/chat/completions`（streaming）
  3. 收到 `tool_calls` 時，在本地透過 MCP toolkit 的 `getMcpTools({ group: 'student' })` 執行對應 tool
  4. 將 tool 結果送回 Hermes 繼續生成
  5. 串流 token 回前端

關鍵：使用 `listMcpTools({ event, group: 'student' })` 取得 student 可用的 tool 清單，確保 `enabled` guard 和 role filter 生效。

### Step 3：改寫 `server/api/student/chat.post.ts`

- 移除對 Python service 的 HTTP 呼叫
- 改為呼叫 Step 2 的 utility
- 保留既有的：SSE 串流格式、chatHistory DB 讀寫、chat_id 回傳邏輯
- Auth：用既有的 `requireAuthSession(event)` 取得 user，將 user 資訊注入 `event.context.mcpPrincipal`

### Step 4：更新 MCP student handler auth

修改 `server/mcp/student.ts`：
- 加入 middleware，從 `event.context.mcpPrincipal`（由 chat.post.ts 注入）或 better-auth session 取得身分
- 移除對 Open-WebUI headers 的依賴

修改 `server/mcp/tools/*.ts` 中的 `getMcpPrincipal` 呼叫：
- 確保 `event.context.mcpPrincipal` 在內部呼叫時也能正確取得（不只依賴 HTTP headers）

### Step 5：前端 ai-chat.vue 微調

- 前端 SSE 格式不變，**不需要大幅修改**
- 可選：為未來 MCP Apps 預留 `structuredContent` 的渲染處理（此階段可不做）

### Step 6：清理

- Python AI service (`packages/ai-service/`) 暫時保留但不再被呼叫，可在驗證穩定後移除
- 移除 `nuxt.config.ts` 中的 `mcpStudentGatewayToken`、`mcpTeacherGatewayToken`（不再需要 gateway token）
- 清理 `server/utils/mcp-auth.ts` 中 Open-WebUI 相關的 header 邏輯

## 需要修改的檔案

| 檔案 | 變更 |
|------|------|
| `nuxt.config.ts` | 新增 `aiBaseUrl`, `aiModel` runtimeConfig |
| `server/utils/ai-chat.ts` | **新增** — AI chat orchestration with tool loop |
| `server/api/student/chat.post.ts` | 改為呼叫本地 ai-chat utility |
| `server/mcp/student.ts` | 加入 session-based middleware |
| `server/utils/mcp-auth.ts` | 簡化，支援 session-based auth |
| `.env.example` | 新增 AI_BASE_URL, AI_MODEL |

## 驗證方式

1. 啟動 dev server + Hermes Agent
2. 以 student 身分登入，開啟 ai-chat 頁面
3. 測試基本對話（無 tool call）→ 確認串流正常
4. 測試「幫我找數學題目」→ 確認 `search_problems` tool 被呼叫
5. 測試「推薦教材」→ 確認 `recommend_materials` tool 被呼叫且只回傳該學生可見的教材
6. 確認 teacher-only tools（如 `create_problem`）不會出現在 student 的 tool 清單中
7. 確認 chat history 正確儲存到 DB
