# Zeabur 部署環境變數檢查表

## web service (Nuxt)

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL=postgres://...`
- [ ] `BETTER_AUTH_SECRET=...`
- [ ] `BETTER_AUTH_URL=https://<your-web-domain>`
- [ ] `AI_SERVICE_URL=http://ai-service:8000`
- [ ] `GOOGLE_CLIENT_ID=...`
- [ ] `GOOGLE_CLIENT_SECRET=...`
- [ ] `OPENAI_API_KEY=...`（若 Nuxt 端功能有使用）
- [ ] `GOOGLE_VISION_API_KEY=...`（若 teacher vision 功能有使用）
- [ ] `R2_ACCOUNT_ID=...`
- [ ] `R2_ACCESS_KEY_ID=...`
- [ ] `R2_SECRET_ACCESS_KEY=...`
- [ ] `R2_BUCKET_NAME=...`
- [ ] `R2_PUBLIC_DOMAIN=...`
- [ ] `CLASS_MATERIALS_R2_ACCOUNT_ID=...`
- [ ] `CLASS_MATERIALS_R2_ACCESS_KEY_ID=...`
- [ ] `CLASS_MATERIALS_R2_SECRET_ACCESS_KEY=...`
- [ ] `CLASS_MATERIALS_R2_BUCKET_NAME=...`
- [ ] `CLASS_MATERIALS_R2_PUBLIC_DOMAIN=...`

## ai-service (FastAPI)

- [ ] `PYTHONUNBUFFERED=1`
- [ ] `OPENAI_API_KEY=...`
- [ ] `MCP_SERVER_URL=http://web:3000/mcp`

## 驗證

- [ ] web 首頁可開啟
- [ ] ai-service health (`GET /`) 回傳 `{"status":"ok"...}`
- [ ] Student chat 可成功串流
- [ ] tool call 可透過 MCP 正常工作
