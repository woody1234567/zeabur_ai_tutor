# Task 9 — Review Findings Fix Report

## Finding 1: Duplicate watchers in TestbankFormDialog.vue

**File:** `app/components/teacher/TestbankFormDialog.vue`

Merged the two separate `watch(() => props.modelValue, ...)` callbacks into a single watcher. When `open` is true, the merged callback initializes form data (from `props.testbank` or defaults) AND calls `dialogRef.value?.showModal()`. When false, it calls `dialogRef.value?.close()`. All existing behavior preserved.

## Finding 2: Wasted /api/problems fetch on "mine" tab

**File:** `app/pages/teacher/problems/index.vue`

Replaced `watch: [queryParams]` and `immediate: shouldFetchProblems.value` with `watch: false` and `immediate: false` on the `useFetch` call. Added an explicit `watch([queryParams, shouldFetchProblems], ...)` with `immediate: true` that only calls `refresh()` when `shouldFetchProblems` is true. This prevents network requests when on the "mine" tab with no testbank selected, while still loading on initial page load (public tab is default).

## Finding 3: Duplicated problem card template

**Files:**
- Created `app/components/teacher/ProblemListCard.vue`
- Modified `app/pages/teacher/problems/index.vue`

Extracted the ~55-line problem card markup into a new `TeacherProblemListCard` component. The component accepts a `problem` prop and emits a `delete` event. Both the public tab and selected-testbank view now use `<TeacherProblemListCard>` instead of inline card markup, eliminating ~100 lines of duplication from the page.

## Verification

Reviewed all three files for syntax correctness. All changes are consistent and preserve the original behavior.
