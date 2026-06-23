# Zeabur Docker 快速部署規劃（Nuxt + AI Service）

> 目標：把目前「本地三段式（Nuxt + FastAPI + Postgres）」轉成 Zeabur 上可快速重現、可維運的部署流程。

## 1) 建議部署拓樸（最穩）

在 Zeabur 建 3 個服務：

1. **web**（Nuxt app，Dockerfile 建置）
2. **ai-service**（FastAPI，Dockerfile 建置）
3. **postgres**（Zeabur managed PostgreSQL，避免自己管 volume）

這樣做的原因：
- 故障隔離（web 與 ai-service 可獨立重啟）
- 擴縮彈性（AI 較吃資源，可單獨調整）
- 設定清楚（DB 與 app env 分開）

---

## 2) 關鍵連線關係

- `web` 需要連到：
  - `postgres`（`DATABASE_URL`）
  - `ai-service`（例如 `AI_SERVICE_URL=http://ai-service:8000`）
- `ai-service` 需要連到：
  - `web` 的 MCP endpoint（例如 `MCP_SERVER_URL=http://web:3000/mcp`）
  - OpenAI API（`OPENAI_API_KEY`）

> 注意：目前 `ai-service` 的 MCP URL 是硬編碼 `http://localhost:3000/mcp`，上 Zeabur 前要改成 env 驅動，不然容器間無法互通。

---

## 3) 最小改造清單（P0）

1. **`packages/ai-service/src/tools/mcp_manager.py`**
   - 把 `http://localhost:3000/mcp` 改為 `MCP_SERVER_URL`（含 default）

2. **Nuxt server chat endpoint**（`server/api/student/chat.post.ts`）
   - 把 `http://localhost:8000/chat/stream` 改為 `AI_SERVICE_URL`（含 default）

3. **新增 Dockerfile（兩份）**
   - repo root：Nuxt runtime image
   - `packages/ai-service/`：FastAPI runtime image

4. **補 `.dockerignore`**
   - 排除 `node_modules`, `.git`, `.nuxt`, `__pycache__`, `.venv` 等

---

## 4) Zeabur 端部署步驟（快速）

1. 建立 Zeabur Project，連 GitHub repo。
2. 新增 PostgreSQL service（取得連線字串）。
3. 新增 `web` service（指定 root Dockerfile）。
4. 新增 `ai-service` service（指定 `packages/ai-service/Dockerfile`）。
5. 設定環境變數：
   - `web`：`DATABASE_URL`, `BETTER_AUTH_SECRET`, OAuth, R2, `AI_SERVICE_URL`
   - `ai-service`：`OPENAI_API_KEY`, `MCP_SERVER_URL`
6. 先 deploy `web` + `ai-service`，再跑 migration（可在 web 啟動前後一次性執行）。
7. 驗證：
   - `GET /` (web)
   - `GET /` (ai-service health)
   - 實測 student chat 串流

---

## 5) 建議環境變數模板

### web
- `NODE_ENV=production`
- `DATABASE_URL=postgres://...`
- `BETTER_AUTH_SECRET=...`
- `NUXT_PUBLIC_BASE_URL=https://<your-web-domain>`
- `OPENAI_API_KEY=...`（若 Nuxt 端也會用）
- `AI_SERVICE_URL=http://ai-service:8000`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `R2_*` / `CLASS_MATERIALS_R2_*`

### ai-service
- `OPENAI_API_KEY=...`
- `MCP_SERVER_URL=http://web:3000/mcp`
- `PYTHONUNBUFFERED=1`

---

## 6) 風險與排錯優先序

1. **容器互連失敗**（最常見）
   - 先檢查 `AI_SERVICE_URL`、`MCP_SERVER_URL`
2. **DB 連線/SSL 問題**
   - 依 Zeabur PG 要求調整 `DATABASE_URL` 參數
3. **migration 未執行**
   - 先 migrate 再驗證登入/資料操作
4. **CORS/反向代理超時**
   - SSE 需確認 Zeabur 代理對長連線的設定

---

## 7) 我建議的執行順序（1~2 小時版）

- Step A：先做 env 化（`AI_SERVICE_URL`、`MCP_SERVER_URL`）
- Step B：補兩個 Dockerfile + `.dockerignore`
- Step C：Zeabur 建三服務 + env
- Step D：一次 migrate + smoke test
- Step E：修正 chat 串流與 tool call 錯誤

---

## 8) 下一步（我可直接幫你做）

如果你同意，我下一步可以直接幫你：
1. 實作上述兩個 URL 的 env 化
2. 新增 Nuxt / ai-service Dockerfile
3. 新增 `.dockerignore`
4. 產一份 `docs/zeabur-env-checklist.md` 讓你照表貼環境變數

並且依你規則，完成後會 commit + push 到 `origin`。
