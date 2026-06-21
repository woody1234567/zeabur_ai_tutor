# Open WebUI 原生 MCP 與角色權限整合設計

> 建立日期：2026-06-20  
> 狀態：核心角色分流已實作；Open WebUI 與部署環境仍待設定

## 目標

將本專案的 Nuxt MCP Server 接到 Open WebUI 原生 MCP，並確保：

- 學生只能使用學生專用的唯讀工具。
- 老師可以使用老師專用的讀寫工具。
- Open WebUI 負責介面與工具可見範圍，Nuxt 負責最終身分驗證與資料授權。
- 即使使用者直接呼叫 MCP endpoint，也不能跨角色或跨帳號存取資料。

## 現況與風險

目前 MCP definitions 直接放在：

- `server/mcp/tools/`
- `server/mcp/resources/`

主要風險如下：

1. `server/mcp/tools/recommend_materials.ts` 接受呼叫端提供的 `studentId`，可能被用來查詢其他學生的資料。
2. `server/mcp/resources/classmaterial_list.ts` 回傳通用教材清單，沒有依目前使用者與班級限制。
3. `server/mcp/resources/testbank_list.ts` 回傳完整題庫 metadata，沒有角色或資料範圍控制。
4. 單靠提示詞、工具描述或 Open WebUI 的 Access Control，無法阻止直接 MCP 呼叫造成的越權。

因此，在接入多使用者 Open WebUI 前，必須先將身分與角色驗證加入 Nuxt MCP。

## 建議架構

```text
Open WebUI
├── Students 群組 ──> /mcp/student ──> 唯讀工具
└── Teachers 群組 ──> /mcp/teacher ──> 讀寫工具
                                  │
                                  v
                         Nuxt 驗證請求來源
                                  │
                                  v
                     依 email 查詢 Better Auth user
                                  │
                                  v
                       驗證 user.role 與資料所有權
                                  │
                                  v
                            Drizzle / PostgreSQL
```

採用兩個 MCP endpoint：

- `https://studywithwoody.site/mcp/student`
- `https://studywithwoody.site/mcp/teacher`

Open WebUI 的群組權限只負責控制工具顯示與一般使用流程；Nuxt MCP middleware 和資料庫查詢才是安全邊界。

## MCP 目錄調整

目前專案使用 `@nuxtjs/mcp-toolkit@0.5.1`。此版本的 named handler 尚未支援新版的 handler middleware 與資料夾自動掛載，因此採用相容結構：

```text
server/mcp/
├── student.ts              # /mcp/student named handler
├── teacher.ts              # /mcp/teacher named handler
├── tools/
│   ├── search_problems.ts
│   ├── recommend_materials.ts
│   └── create_problem.ts
└── resources/
    ├── classmaterial_list.ts
    └── testbank_list.ts
```

`server/mcp/student.ts` 與 `server/mcp/teacher.ts` 明確列出各自可用的工具與 resources。`server/middleware/mcp-auth.ts` 負責 endpoint 認證，並封鎖未分流的 `/mcp`。升級到支援 folder convention 的新版 toolkit 後，可以再遷移成 `server/mcp/handlers/<role>/` 結構。

目前實作的權限如下：

| Endpoint | Tools | Resources |
| --- | --- | --- |
| `/mcp/student` | `search_problems`、`recommend_materials` | `classmaterial_list`，限學生已加入班級 |
| `/mcp/teacher` | `search_problems`、`create_problem` | `classmaterial_list`，限老師自己的教材；`testbank_list` |

### 舊 AI service 相容性

`packages/ai-service` 原本在啟動時以單一、無身分的連線讀取 `/mcp`，並把工具全域快取。這個模式無法安全表達每位學生的身分，因此不能直接接到新的角色 endpoint。目前 `/mcp` 會回傳 `403`，Open WebUI 應直接連線 `/mcp/student` 或 `/mcp/teacher`。

若未來仍要讓 Python AI service 使用 MCP，必須改成每次聊天依使用者建立帶有 Bearer token 與已驗證 email header 的 MCP connection，不能繼續共用全域 MCP tools。Docker 的 web healthcheck 已改為檢查應用程式首頁，避免依賴已封鎖的 `/mcp`。

## Open WebUI 設定

Open WebUI 原生 MCP 使用 Streamable HTTP。建議至少使用 Open WebUI `v0.9.6`，此版本修正了 MCP custom header templates 的 request-time interpolation，並支援 `USER_EMAIL` 與 `USER_ROLE`。

固定設定以下環境變數，不能在容器重建時更換：

```env
WEBUI_SECRET_KEY=<long-random-persistent-secret>
```

### Student MCP

在 **Admin Settings -> External Tools** 新增：

- Type：`MCP (Streamable HTTP)`
- URL：`https://studywithwoody.site/mcp/student`
- Auth：`Bearer`
- Key：Student MCP 專用 gateway token
- Access Control：只授權 Open WebUI 的 `Students` 群組

Custom Headers：

```json
{
  "X-Open-WebUI-User-Email": "{{USER_EMAIL}}",
  "X-Open-WebUI-User-ID": "{{USER_ID}}",
  "X-Open-WebUI-Chat-ID": "{{CHAT_ID}}"
}
```

### Teacher MCP

新增第二個 External Tool：

- Type：`MCP (Streamable HTTP)`
- URL：`https://studywithwoody.site/mcp/teacher`
- Auth：`Bearer`
- Key：Teacher MCP 專用 gateway token
- Access Control：只授權 Open WebUI 的 `Teachers` 群組
- Custom Headers：與 Student MCP 相同

Student 與 Teacher endpoint 應使用不同的 gateway token，避免其中一個 token 洩漏後可同時存取兩個 endpoint。

Open WebUI 的內建 `USER_ROLE` 通常表示 `user` 或 `admin`，不能直接對應本專案的 `student` 或 `teacher`。Nuxt 應使用經過驗證的 email 查詢專案資料庫中的 `user.role`。

## Nuxt 設定

在 `nuxt.config.ts` 加入：

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    mcpStudentGatewayToken: "",
    mcpTeacherGatewayToken: "",
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
  mcp: {
    name: "Study With Woody",
    description: "Role-scoped learning tools for students and teachers.",
    defaultHandlerStrategy: "orphans",
  },
});
```

部署環境需設定：

```env
NUXT_MCP_STUDENT_GATEWAY_TOKEN=<student-random-secret>
NUXT_MCP_TEACHER_GATEWAY_TOKEN=<teacher-random-secret>
```

使用 `NUXT_` 前綴可讓 Nitro 在 production runtime 覆寫 private runtime config，不依賴 build-time 環境變數。

## MCP 身分驗證

建立 `server/utils/mcp-auth.ts`，負責：

1. 驗證 `Authorization: Bearer ...`。
2. 使用 constant-time comparison 比較 gateway token。
3. 讀取 `X-Open-WebUI-User-Email`。
4. 依 email 查詢 Better Auth 的 `user` table。
5. 驗證該帳號的 `role` 是否能使用目前 endpoint。
6. 將可信任的 principal 寫入 `event.context.mcpPrincipal`。

概念範例：

```ts
export async function requireMcpPrincipal(
  event: H3Event,
  allowedRoles: string[],
  expectedToken: string,
) {
  const token = getHeader(event, "authorization")?.replace(/^Bearer /, "");
  const email = getHeader(event, "x-open-webui-user-email");

  if (!token || !email || !secureTokenEqual(token, expectedToken)) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const [account] = await db
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  if (!account || !allowedRoles.includes(account.role ?? "")) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  return {
    id: account.id,
    email: account.email,
    role: account.role,
  };
}
```

認證失敗建議回傳 `403`，不要回傳 `401`。部分 MCP client 會把 `401` 解讀為 OAuth discovery 的啟動訊號。

### Student handler

```ts
export default defineMcpHandler({
  description: "Read-only tools for students",
  middleware: async (event) => {
    const config = useRuntimeConfig(event);

    event.context.mcpPrincipal = await requireMcpPrincipal(
      event,
      ["student", "admin"],
      config.mcpStudentGatewayToken,
    );
  },
});
```

Teacher handler 採用相同模式，但使用 Teacher token，允許角色為 `teacher` 與 `admin`。

允許 `admin` 的主要原因是管理員需要在 Open WebUI 驗證連線與維護工具。如果不需要管理員直接測試，可以移除 `admin`。

## Student tool 設計規則

Student tools 必須符合：

- 全部標示 `readOnlyHint: true`。
- 不接受 `studentId`、`userId`、`role` 等身分欄位。
- 從 `event.context.mcpPrincipal.id` 取得學生 ID。
- 教材、作業、班級與答題記錄查詢都必須限制在該學生可存取的資料。
- 所有 list/search 工具必須有筆數限制或 pagination。

例如 `recommend_materials` 應移除 `studentId`：

```ts
export default defineMcpTool({
  description: "Recommend materials available to the current student.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    keyword: z.string().optional().describe("Optional search keyword"),
    limit: z.number().int().min(1).max(20).default(5),
  },
  handler: async ({ keyword, limit }) => {
    const principal = useEvent().context.mcpPrincipal;

    return recommendMaterials({
      studentId: principal.id,
      keyword,
      limit,
    });
  },
});
```

## Teacher tool 設計規則

Teacher tools 可以包含 write operations，但必須：

- 正確標示 `readOnlyHint`、`destructiveHint` 與 `idempotentHint`。
- 不接受 `teacherId` 作為輸入，從 authenticated principal 取得。
- 每次讀寫 classroom、homework、material 時都檢查該資料屬於目前老師。
- 刪除、發布或覆寫操作應要求明確參數，並回傳可稽核的 resource ID。
- 不信任模型產生的所有權或角色資訊。

例如更新作業不能只依 homework ID：

```ts
where(eq(homeworks.id, homeworkId))
```

必須同時限制老師所有權：

```ts
where(
  and(
    eq(homeworks.id, homeworkId),
    eq(homeworks.teacherId, principal.id),
  ),
)
```

現有 Teacher API 已有多個類似的 ownership checks。建議把資料存取與授權抽成共用 service，供 API route 與 MCP tool 共用，避免產生兩套不同的授權邏輯。

## 信任邊界與正式環境要求

短期方案採用：

```text
Open WebUI Bearer gateway token
+ Open WebUI user email header
+ Nuxt DB role lookup
+ HTTPS / private service network
```

`X-Open-WebUI-User-Email` 本身不能被信任。只有在 gateway token 驗證成功，而且 MCP endpoint 只能由 Open WebUI 或受控網路存取時，才能使用該 header 對應使用者。

正式環境至少需要：

- 全程 HTTPS。
- Student 與 Teacher 使用不同的長隨機 token。
- Token 只存在 Open WebUI secret storage 與 Nuxt server runtime config。
- MCP endpoint 加入 rate limiting。
- 記錄 user ID、role、tool name、chat ID、resource ID、結果與執行時間。
- 不在 log 中記錄 gateway token、完整教材內容或學生敏感資料。
- Open WebUI 與本專案使用相同且已驗證的使用者 email。
- 禁止一般使用者自行新增 Direct Tool Servers。

長期較完整的方案，是讓 Open WebUI 與 Nuxt 共用 OIDC Provider，並讓 MCP resource server 實作 OAuth 2.1。這能以每位使用者的 access token 取代共享 gateway token，但實作與維運成本較高，可在 MVP 驗證後再導入。

## 驗證清單

### 連線與工具可見性

- [ ] Open WebUI Student connection 能連到 `/mcp/student`。
- [ ] Open WebUI Teacher connection 能連到 `/mcp/teacher`。
- [ ] Students 群組看不到 Teacher MCP。
- [ ] Teachers 群組看不到 Student MCP，或依產品需求決定是否也授權 Student read tools。
- [x] 未受保護的 `/mcp` 回傳 `403`，不再提供正式工具或 resources。

### 身分與角色

- [x] 無 Bearer token 時回傳 `403`。
- [x] 錯誤 token 時回傳 `403`。
- [ ] 缺少 email header 時回傳 `403`。
- [ ] 資料庫找不到對應 email 時回傳 `403`。
- [ ] Student token 不能呼叫 Teacher endpoint。
- [ ] Teacher token 不能讓 student role 通過 Teacher endpoint。

### 資料隔離

- [x] Student tool schema 不包含 `studentId`。
- [ ] 學生不能讀取其他學生的教材、作業、答題或錯題資料。
- [ ] 學生只能讀取自己所屬班級的教材與作業。
- [ ] 老師不能讀寫其他老師的 classroom、homework 或 material。
- [ ] 修改 tool input 中的 resource ID 仍無法越權。
- [x] 目前 MCP list/search 工具有固定上限。

### 稽核與操作安全

- [ ] Write tool annotations 與實際行為一致。
- [ ] Destructive tools 有明確的確認流程或 UI 提示。
- [ ] 每次 tool call 都有結構化 audit log。
- [ ] Log 不包含 secret 或不必要的學生敏感資料。
- [ ] Gateway token 可以輪替。

## 參考資料

- [Open WebUI 原生 MCP](https://docs.openwebui.com/features/extensibility/mcp)
- [Open WebUI MCP-to-OpenAPI（mcpo）](https://docs.openwebui.com/features/extensibility/plugin/tools/openapi-servers/mcp)
- [Nuxt MCP Toolkit](https://mcp-toolkit.nuxt.dev)
