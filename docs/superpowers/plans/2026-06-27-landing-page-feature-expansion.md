# Landing Page Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `app/pages/index.vue` with 3 new feature cards and a role-based "Built for Everyone" section, fully bilingual (EN + zhTW).

**Architecture:** Add i18n keys to both locale files first, then update the Vue template in one focused edit. The landing page already uses `$t()` for all copy, so this follows the established pattern exactly.

**Tech Stack:** Nuxt 4, Vue 3, DaisyUI, @nuxtjs/i18n (en / zhTW)

## Global Constraints

- Follow existing DaisyUI `card bg-base-100 shadow-xl` pattern for new feature cards
- All copy must have keys in both `i18n/locales/en.json` and `i18n/locales/zhTW.json`
- Use `$t()` in templates — no hardcoded strings
- No new routes, components, or pages; changes are limited to the 3 files listed below

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `i18n/locales/en.json` | Modify | Add EN keys for 3 new feature cards + role section |
| `i18n/locales/zhTW.json` | Modify | Add zhTW keys for same content |
| `app/pages/index.vue` | Modify | Add 3 new feature cards + "Built for Everyone" section |

---

### Task 1: Add English i18n keys

**Files:**
- Modify: `i18n/locales/en.json` — add keys under `landing.features` and new `landing.roles` namespace

**Interfaces:**
- Produces: i18n keys consumed by Task 3's template additions

- [ ] **Step 1: Add 3 new feature card keys under `landing.features`**

In `i18n/locales/en.json`, inside the `"landing" > "features"` object (after the existing `"instant_feedback"` block), add:

```json
"ai_tutor_chat": {
  "title": "AI Tutor Chat",
  "description": "Get streaming, personalized explanations for any problem. The AI recommends relevant problems and materials during your conversation."
},
"class_materials": {
  "title": "Class Materials",
  "description": "Teachers upload and organize learning materials in folders. Students access everything shared to their classrooms in one place."
},
"scheduling": {
  "title": "Teacher Scheduling",
  "description": "Teachers publish available time slots. Students browse teacher profiles and book sessions directly from the platform."
}
```

- [ ] **Step 2: Add the `landing.roles` namespace**

In `i18n/locales/en.json`, inside the `"landing"` object (after the `"features"` block), add:

```json
"roles": {
  "title": "Built for Everyone",
  "student": {
    "title": "Student",
    "feature_1": "Practice problems from the testbank",
    "feature_2": "Track wrong answers and save favorites",
    "feature_3": "Complete and review homework assignments",
    "feature_4": "Access class materials shared by teachers",
    "feature_5": "Browse teacher profiles and book sessions"
  },
  "teacher": {
    "title": "Teacher",
    "feature_1": "Build a problem bank with AI assistance",
    "feature_2": "Manage classrooms and enrolled students",
    "feature_3": "Assign homework and track completion scores",
    "feature_4": "Upload and share class materials",
    "feature_5": "Publish schedules and manage student bookings"
  },
  "parent": {
    "title": "Parent",
    "feature_1": "Link your account to your child's student account",
    "feature_2": "View your child's classroom enrollments",
    "feature_3": "Monitor homework performance and scores",
    "feature_4": "Track progress across multiple classrooms"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add i18n/locales/en.json
git commit -m "feat(i18n): add EN keys for landing page feature expansion"
```

---

### Task 2: Add Traditional Chinese i18n keys

**Files:**
- Modify: `i18n/locales/zhTW.json` — mirror the same structure added in Task 1

**Interfaces:**
- Consumes: key structure from Task 1
- Produces: zhTW translations consumed by Task 3's template

- [ ] **Step 1: Add 3 new feature card keys under `landing.features`**

In `i18n/locales/zhTW.json`, inside the `"landing" > "features"` object (after the existing `"instant_feedback"` block), add:

```json
"ai_tutor_chat": {
  "title": "AI 家教對話",
  "description": "針對任何題目獲得即時、個人化的解析。AI 在對話過程中推薦相關題目與學習資料。"
},
"class_materials": {
  "title": "課程資料",
  "description": "老師將學習資料上傳至資料夾並整理。學生可在同一地方存取班級分享的所有內容。"
},
"scheduling": {
  "title": "老師預約",
  "description": "老師發佈可預約的時段。學生瀏覽老師資料，直接在平台上預約課程。"
}
```

- [ ] **Step 2: Add the `landing.roles` namespace**

In `i18n/locales/zhTW.json`, inside the `"landing"` object (after the `"features"` block), add:

```json
"roles": {
  "title": "為每位使用者打造",
  "student": {
    "title": "學生",
    "feature_1": "從題庫練習各科題目",
    "feature_2": "追蹤錯題並收藏常用題目",
    "feature_3": "完成並檢視作業",
    "feature_4": "存取老師分享的課程資料",
    "feature_5": "瀏覽老師資料並預約課程"
  },
  "teacher": {
    "title": "老師",
    "feature_1": "借助 AI 建立題目庫",
    "feature_2": "管理班級與學生名單",
    "feature_3": "派發作業並追蹤完成成績",
    "feature_4": "上傳並分享課程資料",
    "feature_5": "發佈時間表並管理學生預約"
  },
  "parent": {
    "title": "家長",
    "feature_1": "將帳號與孩子的學生帳號連結",
    "feature_2": "檢視孩子的班級",
    "feature_3": "監控作業成績與完成情況",
    "feature_4": "追蹤多個班級的學習進度"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add i18n/locales/zhTW.json
git commit -m "feat(i18n): add zhTW keys for landing page feature expansion"
```

---

### Task 3: Update the landing page template

**Files:**
- Modify: `app/pages/index.vue`

**Interfaces:**
- Consumes: i18n keys from Tasks 1 and 2

- [ ] **Step 1: Add 3 new feature cards to the existing grid**

In `app/pages/index.vue`, find the closing `</div>` of the feature grid (after the third `<!-- Feature 3 -->` card block, before `</div></div>`). Add these three cards inside the same grid `<div>`:

```vue
<!-- Feature 4 -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body items-center text-center">
    <div class="text-primary mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    </div>
    <h3 class="card-title">
      {{ $t("landing.features.ai_tutor_chat.title") }}
    </h3>
    <p>
      {{ $t("landing.features.ai_tutor_chat.description") }}
    </p>
  </div>
</div>

<!-- Feature 5 -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body items-center text-center">
    <div class="text-primary mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    </div>
    <h3 class="card-title">
      {{ $t("landing.features.class_materials.title") }}
    </h3>
    <p>
      {{ $t("landing.features.class_materials.description") }}
    </p>
  </div>
</div>

<!-- Feature 6 -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body items-center text-center">
    <div class="text-primary mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
    <h3 class="card-title">
      {{ $t("landing.features.scheduling.title") }}
    </h3>
    <p>
      {{ $t("landing.features.scheduling.description") }}
    </p>
  </div>
</div>
```

- [ ] **Step 2: Add the "Built for Everyone" role section**

Immediately after the closing `</div>` of the features section (the one with `py-20 container mx-auto px-4`), add:

```vue
<!-- Roles Section -->
<div class="py-20 bg-base-100">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">
      {{ $t("landing.roles.title") }}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Student -->
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          <h3 class="card-title text-primary mb-4">
            {{ $t("landing.roles.student.title") }}
          </h3>
          <ul class="space-y-2">
            <li v-for="n in 5" :key="n" class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ $t(`landing.roles.student.feature_${n}`) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Teacher -->
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          <h3 class="card-title text-primary mb-4">
            {{ $t("landing.roles.teacher.title") }}
          </h3>
          <ul class="space-y-2">
            <li v-for="n in 5" :key="n" class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ $t(`landing.roles.teacher.feature_${n}`) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Parent -->
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          <h3 class="card-title text-primary mb-4">
            {{ $t("landing.roles.parent.title") }}
          </h3>
          <ul class="space-y-2">
            <li v-for="n in 4" :key="n" class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ $t(`landing.roles.parent.feature_${n}`) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Start the dev server and visually verify**

```bash
pnpm dev
```

Check `http://localhost:3000` and confirm:
1. The feature grid now shows 6 cards in 2 rows of 3 (on desktop)
2. The 3 new cards display correct EN titles and descriptions
3. The "Built for Everyone" section appears below the feature grid with 3 role columns
4. Each role column shows a checkmark list with the correct feature bullets
5. Switch to `/zhTW` and verify all new content appears in Traditional Chinese

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(landing): add 3 feature cards and role section to landing page"
```
