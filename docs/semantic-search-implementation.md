# 題庫語意搜尋（Semantic Search）實作計畫

## Status: Planned

## Context

`search-problems` AI tool 目前只支援 `ILIKE` 關鍵字比對。學生用自然語言描述想練習的概念時（如「計算三角形面積的應用題」），若題庫中沒有完全匹配的關鍵字就搜不到。

目標：加入 pgvector 向量搜尋，讓搜尋能理解語意，結合既有的結構化篩選（subject、grade、difficulty 等）提供混合搜尋。

## 架構

```
Before:  query → ILIKE keyword matching → results
After:   query → OpenAI embedding → cosine similarity + keyword filters → results
```

- **Embedding model**: OpenAI `text-embedding-3-small`（1536 維，$0.02/1M tokens）
- **向量資料庫**: PostgreSQL + pgvector 擴展
- **Index**: HNSW（`vector_cosine_ops`）
- **Embedding 設定獨立於 chat LLM**：`EMBEDDING_BASE_URL`、`EMBEDDING_API_KEY` 與 `AI_BASE_URL` 分開，因為 chat LLM 可能指向不支援 embedding 的 provider

## 變更摘要

| 檔案 | 變更 |
|------|------|
| `docker-compose.yaml` / `.yml` | `postgres:16-alpine` → `pgvector/pgvector:pg16` |
| `db/schema.ts` | `problems` 新增 `embedding vector(1536)` + HNSW index |
| `drizzle/0005_*.sql` | migration: `CREATE EXTENSION vector` + ADD COLUMN + CREATE INDEX |
| `nuxt.config.ts` | 新增 `embeddingBaseUrl`、`embeddingModel`、`embeddingApiKey` |
| `server/utils/embedding.ts` | **新增** — embedding 產生工具（buildText、generate、batch、store） |
| `server/utils/problems.ts` | `SearchProblemsCriteria` 新增 `query`，混合搜尋邏輯 |
| `server/utils/ai-tools/search-problems.ts` | 新增 `query` 參數（語意搜尋） |
| `server/mcp/tools/search_problems.ts` | 新增 `query` 參數 |
| `server/api/teacher/problems.post.ts` | insert 後 fire-and-forget 產生 embedding |
| `server/api/teacher/problems/[id].put.ts` | update 後 fire-and-forget 產生 embedding |
| `server/utils/ai-tools/create-problem.ts` | insert 後 fire-and-forget 產生 embedding |
| `server/mcp/tools/create_problem.ts` | insert 後 fire-and-forget 產生 embedding |
| `scripts/backfill-embeddings.ts` | **新增** — 既有題目 embedding backfill 腳本 |

## 核心設計

### Embedding 文字組合

將題目多個欄位組合為一段文字再產生 embedding，提供最豐富的語意表示：

```
[數學] [高一] [二次方程式]
一元二次方程式的應用題
某農場要圍出一塊長方形的區域...
利用公式解，將 x = ...
#二次方程式 #應用題
```

### 混合搜尋邏輯

- **有 `query`**: 產生 query embedding → `cosineDistance()` 排序 + 結構化篩選為 WHERE
- **無 `query`**: 行為完全不變（向下相容）
- **Embedding 為 nullable**: 尚未產生 embedding 的題目在語意搜尋中會被排除，但關鍵字搜尋不受影響

### Embedding 同步策略

- 新增/更新題目時 **fire-and-forget** 產生 embedding（非阻塞，失敗只 log）
- 既有題目由 `scripts/backfill-embeddings.ts` 批次處理（每批 100 筆）
- Backfill 腳本可重複執行（只處理 `WHERE embedding IS NULL`）

## 環境變數

```env
# Embedding（向量搜尋）— 預設用 OpenAI
EMBEDDING_BASE_URL=https://api.openai.com/v1    # 可選，預設 OpenAI
EMBEDDING_MODEL=text-embedding-3-small           # 可選，預設 3-small
EMBEDDING_API_KEY=                               # 可選，預設用 OPENAI_API_KEY
```

## 注意事項

- Zeabur PostgreSQL 需支援 `CREATE EXTENSION vector`
- Docker 本地開發需改用 `pgvector/pgvector:pg16` 映像
- Drizzle ORM 0.44.7 原生支援 pgvector（`vector` type、`cosineDistance()`）

## 驗證

1. `pnpm db:migrate` 成功
2. `pnpm db:backfill-embeddings` 對既有題目產生 embedding
3. AI chat 語意搜尋：「我想練習計算三角形面積的題目」→ 回傳相關結果
4. 結構化篩選仍正常（subject、grade 等）
5. 新增題目後 embedding 自動產生
