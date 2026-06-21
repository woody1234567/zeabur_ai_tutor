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

---

## P0 ~ P2 改善影響範圍（Codebase Impact Analysis）

### P0：加 `content` 搜尋（無 schema 變動）

只需改 1 個檔案，無前端變動。

| 層級 | 檔案 | 變動說明 |
|------|------|---------|
| Service | `server/utils/problems.ts` | `searchProblems()` 新增 `ilike(problems.content, ...)` filter |

其他消費者（MCP tool、AI tool、API routes）都透過 `searchProblems()` 搜尋，自動受益，不需改動。

---

### P1：加 `subject` + `chapter` 欄位

#### DB 層

| 檔案 | 變動說明 |
|------|---------|
| `db/schema.ts` | `problems` 表新增 `subject: text("subject")` 和 `chapter: text("chapter")` |
| `drizzle/` | 執行 `pnpm db:generate` 產生 migration，再 `pnpm db:migrate` |

#### 後端 — 寫入（建立/編輯題目）

| 檔案 | 變動說明 |
|------|---------|
| `server/api/teacher/problems.post.ts` | body 解構新增 `subject`, `chapter`；insert values 新增這兩個欄位 |
| `server/api/teacher/problems/[id].put.ts` | `updateProblemSchema` (zod) 新增 `subject`, `chapter` 欄位；`.set()` 加入 |
| `server/mcp/tools/create_problem.ts` | `inputSchema` 新增 `subject`, `chapter`；insert values 新增 |

#### 後端 — 讀取/搜尋

| 檔案 | 變動說明 |
|------|---------|
| `server/utils/problems.ts` | `SearchProblemsCriteria` type 加 `subject?`, `chapter?`；`searchProblems()` 加對應 filter；select 欄位加 `subject`, `chapter` |
| `server/api/problems/index.get.ts` | query params 新增 `subject`, `chapter`；filter 邏輯新增；select 欄位新增 |
| `server/api/problems/[id].get.ts` | select 欄位新增 `subject`, `chapter` |
| `server/api/teacher/problems/[id].get.ts` | select `*` 已覆蓋（需確認） |
| `server/api/student/favorites.get.ts` | select 欄位加 `subject`, `chapter`；filter 新增 |
| `server/api/student/error-problems.get.ts` | select 欄位加 `subject`, `chapter`；filter 新增 |
| `server/api/student/homeworks/[id].get.ts` | select 欄位加 `subject`, `chapter`（顯示用） |
| `server/api/student/homeworks/[id]/review.get.ts` | select 欄位加 `subject`, `chapter` |
| `server/api/teacher/homeworks/[id].get.ts` | select 欄位加 `subject`, `chapter` |
| `server/utils/testbank.ts` | `getTestbankMetadata()` select 加 `subject`, `chapter` |

#### 後端 — AI / MCP 工具

| 檔案 | 變動說明 |
|------|---------|
| `server/utils/ai-tools/search-problems.ts` | inputSchema 加 `subject`, `chapter` 參數；description 更新 |
| `server/mcp/tools/search_problems.ts` | inputSchema 加 `subject`, `chapter` 參數 |
| `server/mcp/resources/testbank_list.ts` | 自動受益（呼叫 `getTestbankMetadata()`），不需改 |

#### 前端 — 表單（建立/編輯題目）

| 檔案 | 變動說明 |
|------|---------|
| `app/components/teacher/ProblemForm.vue` | `ProblemData` interface 加 `subject`, `chapter`；template 加兩個表單欄位（select / input） |
| `app/pages/teacher/problems/create.vue` | `ProblemData` interface 加 `subject`, `chapter`；`formData` 初始值加 `subject: ""`, `chapter: ""`；`submitProblem` body 加入 |
| `app/pages/teacher/problems/[id]/edit.vue` | 同 create，加載既有 problem 資料時映射新欄位 |

#### 前端 — 搜尋元件

| 檔案 | 變動說明 |
|------|---------|
| `app/components/ProblemSearch.vue` | `filters` 新增 `subject`, `chapter`；emit type 更新；template 加兩個搜尋輸入框 |

#### 前端 — 顯示元件（題目卡片）

| 檔案 | 變動說明 |
|------|---------|
| `app/components/student/ProblemSummaryCard.vue` | `problem` prop type 加 `subject?`, `chapter?`；template 顯示 badge |
| `app/components/ProblemCard.vue` | `Problem` interface 加 `subject`, `chapter`；template 顯示 |
| `app/components/student/ProblemCard.vue` | 視內容決定是否需要加 |
| `app/components/teacher/ProblemPreview.vue` | 預覽區顯示 subject / chapter |

#### 前端 — 使用搜尋的頁面

| 檔案 | 變動說明 |
|------|---------|
| `app/pages/teacher/problems/index.vue` | `searchParams` 加 `subject`, `chapter`；`handleSearch` 更新；卡片顯示新欄位 |
| `app/pages/teacher/homeworks/[id]/add.vue` | `searchParams` 加 `subject`, `chapter`；`handleSearch` 更新 |
| `app/pages/teacher/homeworks/create.vue` | 若有搜尋功能，同上 |
| `app/pages/student/problems/index.vue` | 搜尋參數更新；卡片顯示新欄位 |
| `app/pages/student/favorites.vue` | 卡片顯示新欄位 |
| `app/pages/student/wrong.vue` | 卡片顯示新欄位 |

#### i18n

| 檔案 | 變動說明 |
|------|---------|
| `i18n/locales/en.json` | 部分 key 已存在（`subject_label`, `chapter_label` 等），需確認完整性並補齊 |
| `i18n/locales/zhTW.json` | 對應新增中文翻譯 |

---

### P2：加 `grade` 欄位 + 標準化 `difficulty`

影響範圍與 P1 相同，額外加上：

#### DB 層

| 檔案 | 變動說明 |
|------|---------|
| `db/schema.ts` | 新增 `grade: text("grade")`；`difficulty` 保持 text 但在應用層約束 enum |
| `drizzle/` | migration：新增 grade 欄位；（可選）UPDATE 現有 difficulty 資料統一為 `easy`/`medium`/`hard` |

#### 後端

與 P1 同批檔案，差異在：
- 所有 insert/update 路徑新增 `grade`
- 所有 select 路徑新增 `grade`
- `searchProblems()` 加 `grade` filter
- `updateProblemSchema` 中 `difficulty` 已經是 `z.enum(["easy", "medium", "hard"])`（現有 `[id].put.ts` 已實作），需確認 `problems.post.ts` 也統一

#### 前端

與 P1 同批檔案，差異在：
- `ProblemForm.vue` 加 `grade` select 下拉
- `ProblemSearch.vue` 加 `grade` 篩選
- 所有卡片元件顯示 grade badge
- `difficulty` 顯示已有 badge mapping（`easy` → green, `medium` → yellow, `hard` → red），不需改

---

### 總覽：依檔案分類

```
改動量統計（P0 + P1 + P2 合計）

db/schema.ts                                          ← 1 次改動
drizzle/                                              ← 2 次 migration

server/utils/problems.ts                              ← P0 + P1 + P2 累進改動
server/utils/testbank.ts                              ← P1
server/utils/ai-tools/search-problems.ts              ← P1
server/api/problems/index.get.ts                      ← P1 + P2
server/api/problems/[id].get.ts                       ← P1 + P2
server/api/teacher/problems.post.ts                   ← P1 + P2
server/api/teacher/problems/[id].put.ts               ← P1 + P2
server/api/teacher/problems/[id].get.ts               ← P1 + P2
server/api/teacher/homeworks/[id].get.ts              ← P1
server/api/student/favorites.get.ts                   ← P1 + P2
server/api/student/error-problems.get.ts              ← P1 + P2
server/api/student/homeworks/[id].get.ts              ← P1
server/api/student/homeworks/[id]/review.get.ts       ← P1
server/mcp/tools/search_problems.ts                   ← P1 + P2
server/mcp/tools/create_problem.ts                    ← P1 + P2

app/components/ProblemSearch.vue                      ← P1 + P2
app/components/ProblemCard.vue                        ← P1 + P2
app/components/teacher/ProblemForm.vue                ← P1 + P2
app/components/teacher/ProblemPreview.vue              ← P1
app/components/student/ProblemSummaryCard.vue          ← P1 + P2
app/pages/teacher/problems/create.vue                 ← P1 + P2
app/pages/teacher/problems/[id]/edit.vue              ← P1 + P2
app/pages/teacher/problems/index.vue                  ← P1 + P2
app/pages/teacher/homeworks/[id]/add.vue              ← P1
app/pages/student/problems/index.vue                  ← P1 + P2
app/pages/student/favorites.vue                       ← P1
app/pages/student/wrong.vue                           ← P1

i18n/locales/en.json                                  ← P1 + P2
i18n/locales/zhTW.json                                ← P1 + P2
```

後端 ~16 檔、前端 ~12 檔、i18n 2 檔、DB 1 檔 = **約 31 個檔案**需要改動。
