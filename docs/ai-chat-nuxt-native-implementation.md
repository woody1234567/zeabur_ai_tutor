# AI Chat 改善：移除 Python AI Service，改用 Nuxt 原生 OpenAI SDK + MCP Toolkit

## Status: Implemented

## Context

ai-chat 頁面原本透過 Python FastAPI + LangGraph 微服務處理 AI 對話，該服務再透過 SSE 連接 Nuxt MCP server 取得工具。改為 Nuxt 原生方案，原因：
1. 減少部署複雜度（不再需要 Python 服務）
2. MCP auth 改用 better-auth session（不再依賴 Open-WebUI headers）
3. 支援未來 MCP Apps（互動式 UI）——Nuxt 控制 tool 執行，`structuredContent` 可直接串流回前端

## 架構

```
Before:  ai-chat.vue → chat.post.ts → Python FastAPI → Nuxt MCP Server
After:   ai-chat.vue → chat.post.ts → [OpenAI-compatible LLM + 本地 MCP tool 執行]
```

LLM provider 可透過環境變數切換（OpenAI、Hermes Agent、vLLM、Ollama 等）。

## 變更摘要

| 檔案 | 變更 |
|------|------|
| `nuxt.config.ts` | 新增 `aiBaseUrl`, `aiModel`, `aiApiKey` runtimeConfig |
| `server/utils/ai-chat.ts` | **新增** — OpenAI SDK streaming + tool calling loop |
| `server/api/student/chat.post.ts` | 改為呼叫本地 ai-chat utility，注入 mcpPrincipal |
| `server/mcp/student.ts` | 加入 session-based middleware |
| `server/mcp/teacher.ts` | 加入 session-based middleware |
| `server/middleware/mcp-auth.ts` | 簡化為只阻擋 `/mcp` 根路徑 |
| `server/utils/mcp-auth.ts` | 移除 Open-WebUI header 邏輯，只保留 `getMcpPrincipal()` |
| `.env.example` | 新增 `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`；移除舊 gateway token |

## 環境變數

```bash
# AI LLM Backend (OpenAI-compatible)
AI_BASE_URL=https://api.openai.com/v1   # 或 Hermes Agent URL
AI_MODEL=gpt-4o                          # 或 hermes
AI_API_KEY=sk-...                        # API key
```

## Tool Calling 流程

1. `chat.post.ts` 注入 `event.context.mcpPrincipal`（student 身分）
2. `ai-chat.ts` 將 MCP student tools 轉換為 OpenAI function definitions（via `zodFunction`）
3. 呼叫 LLM `/v1/chat/completions`（streaming）
4. 收到 `tool_calls` → 在本地執行 MCP tool handler → 送回 LLM
5. 最多 5 輪 tool calling，串流 token + tool 狀態回前端
6. 前端 SSE 格式不變，`ai-chat.vue` 無需修改

## 驗證方式

1. 啟動 dev server，設定 `AI_BASE_URL` 和 `AI_API_KEY`
2. 以 student 身分登入，開啟 ai-chat 頁面
3. 測試基本對話（無 tool call）→ 確認串流正常
4. 測試「幫我找數學題目」→ 確認 `search_problems` tool 被呼叫
5. 測試「推薦教材」→ 確認 `recommend_materials` 只回傳該學生可見的教材
6. 確認 teacher-only tools（如 `create_problem`）不會出現在 student 的 tool 清單中
7. 確認 chat history 正確儲存到 DB
