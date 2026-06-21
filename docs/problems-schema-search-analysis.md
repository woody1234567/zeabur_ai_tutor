# 題目 Schema 搜尋能力分析

## 現有 `problems` 表欄位

| 欄位 | 類型 | 用途 |
|------|------|------|
| `id` | text (UUID) | 主鍵 |
| `title` | text (not null) | 題目標題 |
| `content` | text (not null) | 題目內容 |
| `choices` | jsonb (not null) | 選項 |
| `correctAnswer` | text (not null) | 正確答案 |
| `explanation` | text (nullable) | 解析 |
| `difficulty` | text (nullable) | 難度（自由文字） |
| `source` | text (nullable) | 來源 |
| `imageUrl` | text (nullable) | 圖片 URL |
| `hashtags` | jsonb (string[]) | 標籤陣列 |
| `createdAt` / `updatedAt` | timestamp | 時間戳 |

## 現有搜尋能力（`searchProblems` service function）

| 欄位 | 搜尋方式 | 限制 |
|------|---------|------|
| `title` | `ilike %keyword%` | 只能模糊比對標題文字 |
| `source` | `ilike %keyword%` | 只能模糊比對來源名稱 |
| `hashtags` | jsonb `@>` 精確包含 | 必須完全匹配 tag，如 `#三角函數` |

搜尋邏輯位於 `server/utils/problems.ts` 的 `searchProblems()`，被 MCP tool (`server/mcp/tools/search_problems.ts`) 和 AI tool (`server/utils/ai-tools/search-problems.ts`) 共同使用。

## 不足之處

### 1. 缺乏結構化分類欄位

- 沒有 `subject`（科目：數學、物理、英文…）
- 沒有 `chapter` / `unit`（章節：第三章、二次方程式）
- 沒有 `grade`（年級：國一、高二）
- `hashtags` 是自由文字陣列，無法保證一致性，AI 很難可靠地用它篩選

### 2. 不搜尋題目內容

- `searchProblems()` 只查 `title`、`source`、`hashtags`，不查 `content`
- 學生問「找有關二次方程的題目」，如果標題沒寫但題目內容有，就找不到

### 3. 沒有語意搜尋能力

- 全部靠 `ilike` 字串比對，沒有 PostgreSQL full-text search (`tsvector`) 也沒有 embedding 向量搜尋
- 學生說「三角形面積」，但標題寫「直角三角形求面積」→ ilike 能部分 match
- 學生說「畢氏定理」，但標題寫「勾股定理」→ 完全找不到

### 4. `difficulty` 是自由文字

- 沒有 enum 約束，可能有 `easy`、`簡單`、`1`、`初級` 等不一致的值
- AI 無法可靠地按難度篩選

## 改善建議

依優先級排序：

| 優先級 | 改善項目 | 做法 | Schema 變動 |
|-------|---------|------|------------|
| **P0** | 加 `content` 搜尋 | `searchProblems` 加上 `ilike(problems.content, ...)` | 無 |
| **P1** | 加 `subject` 欄位 | schema 加 `subject: text("subject")`，建立題目時要求填寫科目 | 需 migration |
| **P1** | 加 `chapter` 欄位 | schema 加 `chapter: text("chapter")`，對應課綱章節 | 需 migration |
| **P2** | 加 `grade` 欄位 | schema 加 `grade: text("grade")`，標記適用年級 | 需 migration |
| **P2** | 標準化 `difficulty` | 改為 enum-like：`easy` / `medium` / `hard`，migration 時統一現有資料 | 需 migration + 資料轉換 |
| **P3** | PostgreSQL 全文搜尋 | 對 `title` + `content` 建 `tsvector` index，支援中文分詞（需 `zhparser` 或 `pg_jieba`） | 需 extension + index |
| **P4** | Embedding 向量搜尋 | 用 `pgvector` 存題目 embedding，支援語意搜尋（「畢氏定理」=「勾股定理」） | 需 extension + 欄位 + 建 embedding pipeline |

### 建議實作順序

1. **P0**（零成本高收益）：只改 `server/utils/problems.ts` 一行，讓 `content` 也被搜尋
2. **P1**（AI 正確搜尋的最低門檻）：加 `subject` + `chapter` 欄位，學生問「數學第三章的題目」才能處理
3. **P2**（提升搜尋精確度）：加 `grade`、標準化 `difficulty`
4. **P3/P4**（長期方向）：全文搜尋 / 語意搜尋，短期可先用 P0+P1 覆蓋大部分場景

## 改善後的搜尋欄位預期

```
problems 表（改善後）
├── title        ← ilike 搜尋（已有）
├── content      ← ilike 搜尋（P0 新增）
├── source       ← ilike 搜尋（已有）
├── hashtags     ← jsonb 包含搜尋（已有）
├── subject      ← 精確比對（P1 新增）
├── chapter      ← ilike 搜尋（P1 新增）
├── grade        ← 精確比對（P2 新增）
├── difficulty   ← 精確比對，標準化值（P2 改善）
└── embedding    ← 向量相似度搜尋（P4 新增）
```
