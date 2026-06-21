# AI Chat 工具架構改善計畫：Service Function 為中心

## 現狀問題

`server/utils/ai-chat.ts` 直接 import MCP tool 定義，強轉型別後當作 OpenAI tools 使用：

```ts
import searchProblemsDef from "../mcp/tools/search_problems";
import recommendMaterialsDef from "../mcp/tools/recommend_materials";

const studentToolDefs: McpToolDef[] = [
  searchProblemsDef as unknown as McpToolDef,
  recommendMaterialsDef as unknown as McpToolDef,
];
```

### 具體問題

| # | 問題 | 影響 |
|---|------|------|
| 1 | **硬編碼工具清單** | 新增 tool 時需手動修改 `ai-chat.ts` |
| 2 | **MCP 與 AI chat 耦合** | AI chat 依賴 MCP tool 的內部結構，兩個消費者用同一份定義但需求不同 |
| 3 | **繞過 MCP middleware** | 直接呼叫 `def.handler(args)` 繞過 handler middleware |
| 4 | **MCP resources 未暴露** | `classmaterial_list` resource 已在 student handler 註冊，但 AI 對話無法存取 |
| 5 | **McpToolDef 型別不安全** | `as unknown as McpToolDef` 強轉，schema 變動不會報錯 |
| 6 | **Tool description 無法針對 LLM 最佳化** | MCP tool 的 description 是給 MCP client 看的，AI chat 可能需要不同措辭 |

---

## 設計方針

**Service function 為中心** — 業務邏輯寫成純 service function，MCP tools 和 AI chat tools 各自包裝，互不依賴。

```
┌─────────────────────────��───────────────────────────┐
│                  Service Functions                    │
│   server/utils/problems.ts  (searchProblems)        │
│   server/utils/materials.ts (recommendMaterials,    │
│                              getClassMaterialsMeta) │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │   MCP Tool Layer    │  │  AI Chat Tool Layer  │
    │  server/mcp/tools/  │  │ server/utils/ai-tools/│
    │                     │  │                      │
    │  - MCP protocol     │  │  - OpenAI function   │
    │  - MCP clients      │  │    calling format    │
    │  - getMcpPrincipal  │  │  - LLM 最佳化描述    │
    └─────────────────────┘  │  - 直接取得 userId   │
                             └──────────────────────┘
```

### 優勢

- **關注點分離** — MCP tools 服務 MCP protocol clients；AI tools 服務 LLM chat
- **獨立演進** — AI tool 的 description/schema 可針對 LLM 理解度調整，不影響 MCP
- **型別安全** — 各層用自己的 type，不需強轉
- **彈性** — AI chat 可有 MCP 不需要的 tools（如 explain_concept），反之亦然

### 取捨

- 新增能力時要在兩處加 tool（MCP + AI），但兩者的 schema/description 需求不同，刻意分開是合理的
- Service function 是 single source of truth，兩個 tool layer 只是薄 wrapper

---

## 目標架構

```
server/
├── utils/
│   ├── problems.ts              ← 純業務邏輯 (已存在)
│   ├── materials.ts             ← 純業務邏輯 (已存在)
│   ├── ai-chat.ts               ← 重寫：streaming + tool loop
│   └── ai-tools/
│       ├── index.ts             ← 匯出所有 AI tools + registry
│       ├── search-problems.ts   ← OpenAI tool def, 呼叫 utils/problems
│       └── recommend-materials.ts ← OpenAI tool def, 呼叫 utils/materials
├── mcp/
│   ├── tools/                   ← 不動，繼續服務 MCP clients
│   │   ├── search_problems.ts
│   │   └── recommend_materials.ts
│   └── student.ts
└── api/
    └── student/chat.post.ts     ← 不動
```

---

## 實作步驟

### Step 1: 定義 AI Tool 型別

新增 `server/utils/ai-tools/types.ts`：

```ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  handler: (args: Record<string, unknown>, context: AiToolContext) => Promise<string>;
}

export interface AiToolContext {
  userId: string;
  classroomId?: string | null;
}

export function toOpenAITool(def: AiToolDefinition): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    },
  };
}
```

### Step 2: 建立 AI Tool 定義

**`server/utils/ai-tools/search-problems.ts`**：

```ts
import { z } from "zod";
import { searchProblems } from "../problems";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  title: z.string().max(200).optional().describe("題目標題關鍵字"),
  source: z.string().max(200).optional().describe("來源（課本、考卷名稱）"),
  hashtag: z.string().max(100).optional().describe("標籤，如 #三角函數"),
  limit: z.number().int().min(1).max(20).default(10).describe("回傳數量上限"),
});

export default {
  name: "search_problems",
  description:
    "搜尋題庫中的練習題。可依標題、來源、標籤篩選。用於學生想找特定主題的題目練習時。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args) => {
    const parsed = inputSchema.parse(args);
    const results = await searchProblems(parsed);
    return JSON.stringify(results, null, 2);
  },
} satisfies AiToolDefinition;
```

**`server/utils/ai-tools/recommend-materials.ts`**：

```ts
import { z } from "zod";
import { recommendMaterials } from "../materials";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  keyword: z.string().max(100).optional().describe("搜尋關鍵字（科目、章節、主題）"),
  limit: z.number().int().min(1).max(20).default(5).describe("推薦數量上限"),
});

export default {
  name: "recommend_materials",
  description:
    "根據學生已加入的班級，推薦相關教材。適合學生詢問某主題有什麼資源可看時使用。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args, context) => {
    const parsed = inputSchema.parse(args);
    const materials = await recommendMaterials({
      studentId: context.userId,
      keyword: parsed.keyword,
      limit: parsed.limit,
    });
    if (materials.length === 0) return "目前沒有找到相關教材。";
    return JSON.stringify(materials, null, 2);
  },
} satisfies AiToolDefinition;
```

### Step 3: 建立 AI Tools Registry

**`server/utils/ai-tools/index.ts`**：

```ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { toOpenAITool, type AiToolDefinition, type AiToolContext } from "./types";
import searchProblems from "./search-problems";
import recommendMaterials from "./recommend-materials";

const tools: AiToolDefinition[] = [
  searchProblems,
  recommendMaterials,
];

export function getOpenAITools(): ChatCompletionTool[] {
  return tools.map(toOpenAITool);
}

export async function executeAiTool(
  name: string,
  args: Record<string, unknown>,
  context: AiToolContext
): Promise<string> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });

  try {
    return await tool.handler(args, context);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export type { AiToolContext };
```

### Step 4: 重寫 `server/utils/ai-chat.ts`

```ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getOpenAITools, executeAiTool, type AiToolContext } from "./ai-tools";

function buildSystemPrompt(userId: string, classroomId?: string | null): string {
  return `You are a helpful AI Tutor assistant.
Student ID: ${userId}
${classroomId ? `Classroom ID: ${classroomId}` : ""}

You can search for practice problems and recommend class materials.
Always respond in the same language the student uses.
When recommending resources, briefly explain why they're relevant.`;
}

export type StreamChatOptions = {
  message: string;
  userId: string;
  history: ChatCompletionMessageParam[];
  classroomId?: string | null;
};

export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const config = useRuntimeConfig();
  const client = new OpenAI({
    baseURL: config.aiBaseUrl,
    apiKey: config.aiApiKey || "",
  });

  const tools = getOpenAITools();
  const toolContext: AiToolContext = {
    userId: options.userId,
    classroomId: options.classroomId,
  };
  const systemPrompt = buildSystemPrompt(options.userId, options.classroomId);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...options.history,
    { role: "user", content: options.message },
  ];

  let fullContent = "";
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await client.chat.completions.create({
      model: config.aiModel,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      stream: true,
    });

    let roundContent = "";
    const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        roundContent += choice.delta.content;
        yield `data: ${JSON.stringify({ type: "token", content: choice.delta.content })}\n\n`;
      }

      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const existing = toolCalls.get(tc.index);
          if (existing) {
            existing.arguments += tc.function?.arguments ?? "";
          } else {
            toolCalls.set(tc.index, {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              arguments: tc.function?.arguments ?? "",
            });
          }
        }
      }

      if (choice.finish_reason === "stop") {
        fullContent += roundContent;
        yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
        return;
      }

      if (choice.finish_reason === "tool_calls") {
        messages.push({
          role: "assistant",
          content: roundContent || null,
          tool_calls: Array.from(toolCalls.values()).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        for (const tc of toolCalls.values()) {
          yield `data: ${JSON.stringify({ type: "tool_start", tool: tc.name })}\n\n`;

          let parsedArgs: Record<string, unknown> = {};
          try { parsedArgs = JSON.parse(tc.arguments); } catch {}

          const result = await executeAiTool(tc.name, parsedArgs, toolContext);

          messages.push({ role: "tool", tool_call_id: tc.id, content: result });
          yield `data: ${JSON.stringify({ type: "tool_result", tool: tc.name })}\n\n`;
        }

        fullContent += roundContent;
        break;
      }
    }

    if (toolCalls.size === 0) {
      fullContent += roundContent;
      yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
      return;
    }
  }

  yield `data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`;
}
```

### Step 5: 清理

- 刪除 `ai-chat.ts` 中舊的 `McpToolDef` type、硬編碼 imports、`buildOpenAITools`、`executeTool`
- `server/mcp/tools/*` 不動 — 繼續服務 MCP protocol clients
- `server/api/student/chat.post.ts` 不動 — `mcpPrincipal` 注入仍需保留（MCP tools 在直連時仍需要）

---

## 關於 mcpPrincipal 的處理

改善後 AI chat 不再直接呼叫 MCP tool handler，而是呼叫 service function。因此：

- `chat.post.ts` 中的 `event.context.mcpPrincipal = {...}` 注入可保留（MCP 直連路徑仍需要）
- AI tool handler 改為接收 `AiToolContext`（含 `userId`），直接傳給 service function
- 不再依賴 `getMcpPrincipal()` — AI tools 的授權由 `chat.post.ts` 的 `requireAuthSession` 保障

這解決了問題 #3：不再繞過 middleware，因為根本不走 MCP tool 路徑。

---

## 未來擴展

### 新增 AI Tool 的流程

1. 需要的話先在 `server/utils/` 新增或擴展 service function
2. 在 `server/utils/ai-tools/` 新增 tool 定義檔
3. 在 `server/utils/ai-tools/index.ts` 的 `tools` 陣列加入
4. （選配）如需 MCP 存取，另外在 `server/mcp/tools/` 加 MCP tool

### Teacher AI Chat

同樣 pattern：
```ts
// server/utils/ai-tools/teacher/
//   create-problem.ts
//   index.ts → teacherTools registry
```

### Resource 注入

未來如需將教材清單注入 system prompt，直接呼叫 `getClassMaterialsMetadata()` service function，不需經過 MCP resource layer：

```ts
const materials = await getClassMaterialsMetadata({ studentId: userId });
// 注入 system prompt
```

---

## 檔案變動清單

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新增 | `server/utils/ai-tools/types.ts` | AiToolDefinition 型別 + toOpenAITool |
| 新增 | `server/utils/ai-tools/search-problems.ts` | AI tool: 搜尋題目 |
| 新增 | `server/utils/ai-tools/recommend-materials.ts` | AI tool: 推薦教材 |
| 新增 | `server/utils/ai-tools/index.ts` | Registry + executeAiTool |
| 重寫 | `server/utils/ai-chat.ts` | 使用 ai-tools registry，移除 MCP 依賴 |
| 不動 | `server/mcp/*` | MCP layer 獨立運作 |
| 不動 | `server/api/student/chat.post.ts` | 認證邏輯不變 |

---

## 驗證計畫

1. `pnpm build` — TypeScript 編譯無 error
2. `pnpm dev` → 發送 chat 訊息 → 確認 `search_problems` / `recommend_materials` 被 LLM 正確呼叫並回傳結果
3. 新增一個 test AI tool → 確認只需加到 `ai-tools/index.ts` 即可生效
4. MCP endpoint (`/api/mcp/student`) 仍正常運作（獨立路徑不受影響）
5. 未登入使用者打 `/api/student/chat` → 401（`requireAuthSession` 攔截）

---

## 實作紀錄（2026-06-21）

### 狀態：✅ 已完成

`pnpm build` 通過，無 TypeScript error。

### 與計畫的差異

計畫原本使用 `export default` 搭配原始 function 名稱（`searchProblems`、`recommendMaterials`），但 Nitro 會自動掃描 `server/utils/` 下所有檔案進行 auto-import。這導致：

- `server/utils/ai-tools/search-problems.ts` 的 default export 與 `server/utils/problems.ts` 的 `searchProblems` 衝突
- `server/utils/ai-tools/recommend-materials.ts` 與 `server/utils/materials.ts` 的 `recommendMaterials` 衝突
- `index.ts` re-export 的 `AiToolContext` 與 `types.ts` 的同名型別衝突

**解法**：改用 named export 並加上 `Tool` suffix 避免 Nitro auto-import 衝突：

| 計畫寫法 | 實際寫法 |
|----------|----------|
| `export default` (search-problems.ts) | `export const searchProblemsTool` |
| `export default` (recommend-materials.ts) | `export const recommendMaterialsTool` |
| `const tools` (index.ts) | `const aiTools`（避免與其他 `tools` 衝突） |
| `export type { AiToolContext }` (index.ts) | 移除，`ai-chat.ts` 直接 `import type` from `./ai-tools/types` |

### 最終檔案結構

```
server/utils/ai-tools/
├── types.ts               ← AiToolDefinition, AiToolContext, toOpenAITool()
├── search-problems.ts     ← export const searchProblemsTool
├── recommend-materials.ts ← export const recommendMaterialsTool
└── index.ts               ← getOpenAITools(), executeAiTool()
```

### 待驗證

- [ ] `pnpm dev` → 實際發送 chat 訊息測試 tool calling 流程
- [ ] MCP endpoint 獨立運作不受影響
