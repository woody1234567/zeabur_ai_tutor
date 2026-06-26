# Link Student-Parent Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the direct "Link" button in the student search list with a "View" button that navigates to a new detail page where admins can both link and unlink parent-student relationships.

**Architecture:** The list page (`link-student-parent.vue`) becomes read-only search; all mutation happens in the new detail page (`link-student-parent/[id].vue`). Two new API endpoints handle reading relationships and unlinking; the existing link endpoint is reused.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, Drizzle ORM (PostgreSQL), DaisyUI, vue-i18n

## Global Constraints

- Admin-only API endpoints: check `session.user.role !== "admin"` and throw 403
- All navigation uses `useLocalePath()` — never hardcode `/en/` or `/zhTW/` prefixes
- i18n keys live under `admin.link_student` in `i18n/locales/en.json` and `i18n/locales/zhTW.json`
- No project test suite exists — verify each task manually in the dev server (`pnpm dev`)
- Follow DaisyUI component patterns used elsewhere in the admin pages (card, btn, table, badge, avatar, loading)

---

### Task 1: Add i18n keys

**Files:**
- Modify: `i18n/locales/en.json`
- Modify: `i18n/locales/zhTW.json`

**Interfaces:**
- Produces: translation keys used by Tasks 4 and 5

- [ ] **Step 1: Add keys to `i18n/locales/en.json`**

Inside the `admin.link_student` object, add the following keys. Also add `view` inside the existing `table` sub-object:

```json
"student_info": "Student Info",
"linked_parents": "Linked Parents",
"no_linked_parents": "No parents linked yet.",
"confirm_unlink": "Are you sure you want to unlink this parent?",
"success_unlink": "Parent unlinked successfully.",
"failed_unlink": "Failed to unlink parent.",
"table": {
  "avatar": "Avatar",
  "name": "Name",
  "email": "Email",
  "role": "Role",
  "action": "Action",
  "link": "Link",
  "view": "View",
  "unlink": "Unlink",
  "linked_at": "Linked At"
}
```

- [ ] **Step 2: Add keys to `i18n/locales/zhTW.json`**

Inside the `admin.link_student` object, add:

```json
"student_info": "學生資訊",
"linked_parents": "已連結的家長",
"no_linked_parents": "尚未連結任何家長。",
"confirm_unlink": "您確定要解除此家長的連結嗎？",
"success_unlink": "成功解除家長連結。",
"failed_unlink": "解除家長連結失敗。",
"table": {
  "avatar": "頭像",
  "name": "姓名",
  "email": "電子郵件",
  "role": "角色",
  "action": "操作",
  "link": "連結",
  "view": "查看",
  "unlink": "解除連結",
  "linked_at": "連結時間"
}
```

- [ ] **Step 3: Commit**

```bash
git add i18n/locales/en.json i18n/locales/zhTW.json
git commit -m "feat(i18n): add link-student-parent detail page translation keys"
```

---

### Task 2: GET student-relationships API endpoint

**Files:**
- Create: `server/api/admin/student-relationships/[id].get.ts`

**Interfaces:**
- Consumes: `db`, `user`, `parentStudents` from schema
- Produces: `GET /api/admin/student-relationships/:id` → `{ student: { id, name, email, image }, parents: Array<{ id, name, email, image, linkedAt }> }`

- [ ] **Step 1: Create the file**

Create `server/api/admin/student-relationships/[id].get.ts`:

```ts
import { eq } from "drizzle-orm";
import { parentStudents, user } from "../../../../db/schema";
import { db } from "../../../../db";
import { requireAuthSession } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const studentId = getRouterParam(event, "id");
  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: "Missing student id" });
  }

  const [student] = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, studentId))
    .limit(1);

  if (!student) {
    throw createError({ statusCode: 404, statusMessage: "Student not found" });
  }

  const parents = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      linkedAt: parentStudents.createdAt,
    })
    .from(parentStudents)
    .innerJoin(user, eq(parentStudents.parentId, user.id))
    .where(eq(parentStudents.studentId, studentId));

  return { student, parents };
});
```

- [ ] **Step 2: Verify manually**

Start the dev server (`pnpm dev`) and hit the endpoint with a valid student ID:

```
curl -b '<session-cookie>' http://localhost:3000/api/admin/student-relationships/<valid-student-id>
```

Expected: `{ student: { id, name, email, image }, parents: [...] }`  
Test invalid ID: expect `404 Student not found`

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/student-relationships/[id].get.ts
git commit -m "feat(api): add GET student-relationships endpoint"
```

---

### Task 3: DELETE unlink-parent-student API endpoint

**Files:**
- Create: `server/api/admin/unlink-parent-student.delete.ts`

**Interfaces:**
- Consumes: `db`, `parentStudents` from schema
- Produces: `DELETE /api/admin/unlink-parent-student` body `{ parentId, studentId }` → `{ success: true }`

- [ ] **Step 1: Create the file**

Create `server/api/admin/unlink-parent-student.delete.ts`:

```ts
import { and, eq } from "drizzle-orm";
import { parentStudents } from "../../../db/schema";
import { db } from "../../../db";
import { requireAuthSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  const { parentId, studentId } = body;

  if (!parentId || !studentId) {
    throw createError({ statusCode: 400, statusMessage: "Missing parentId or studentId" });
  }

  const deleted = await db
    .delete(parentStudents)
    .where(
      and(eq(parentStudents.parentId, parentId), eq(parentStudents.studentId, studentId))
    )
    .returning();

  if (deleted.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Relationship not found" });
  }

  return { success: true };
});
```

- [ ] **Step 2: Verify manually**

With the dev server running, call the endpoint with a valid `parentId` + `studentId` pair from the DB.  
Expected: `{ success: true }` and the row removed.  
Call again with same pair: expect `404 Relationship not found`.

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/unlink-parent-student.delete.ts
git commit -m "feat(api): add DELETE unlink-parent-student endpoint"
```

---

### Task 4: Modify list page — replace Link with View

**Files:**
- Modify: `app/pages/admin/link-student-parent.vue`

**Interfaces:**
- Consumes: existing `pendingParentId`, `searchResults` refs
- Produces: navigates to `link-student-parent/[studentId]?pendingParentId=<id>` on View click

- [ ] **Step 1: Remove `linkStudent` and add `viewStudent`**

In the `<script setup>` block, remove the entire `linkStudent` function:

```ts
// DELETE this entire function:
const linkStudent = async (studentId: string) => {
  if (!confirm(t("admin.link_student.confirm_link"))) return;
  try {
    await $fetch("/api/admin/link-parent-student", { ... });
    alert(t("admin.link_student.success_link"));
    navigateTo(localePath("/admin/pending-parents"));
  } catch (error) { ... }
};
```

Replace it with:

```ts
const viewStudent = (studentId: string) => {
  navigateTo(
    localePath({
      path: `/admin/link-student-parent/${studentId}`,
      query: pendingParentId ? { pendingParentId } : {},
    })
  );
};
```

- [ ] **Step 2: Update the table action button in the template**

Find:

```html
<button
  class="btn btn-sm btn-primary"
  @click="linkStudent(user.id)"
>
  {{ $t("admin.link_student.table.link") }}
</button>
```

Replace with:

```html
<button
  class="btn btn-sm btn-primary"
  @click="viewStudent(user.id)"
>
  {{ $t("admin.link_student.table.view") }}
</button>
```

- [ ] **Step 3: Verify manually**

In the browser at `http://localhost:3000/admin/link-student-parent?id=<pendingParentId>`, search for a student. Confirm the button now reads "View" and clicking it navigates to `/admin/link-student-parent/<studentId>?pendingParentId=<pendingParentId>`.

- [ ] **Step 4: Commit**

```bash
git add app/pages/admin/link-student-parent.vue
git commit -m "feat(admin): replace link button with view in student search"
```

---

### Task 5: Create detail page

**Files:**
- Create: `app/pages/admin/link-student-parent/[id].vue`

**Interfaces:**
- Consumes: `GET /api/admin/student-relationships/:id`, `GET /api/admin/pending-parents?id=`, `POST /api/admin/link-parent-student`, `DELETE /api/admin/unlink-parent-student`
- Produces: full detail page at route `/admin/link-student-parent/:id`

- [ ] **Step 1: Create the file**

Create `app/pages/admin/link-student-parent/[id].vue`:

```vue
<script setup lang="ts">
definePageMeta({ layout: "admin" });
const localePath = useLocalePath();
const { t } = useI18n();
const route = useRoute();

const studentId = route.params.id as string;
const pendingParentId = route.query.pendingParentId as string | undefined;

const backPath = computed(() =>
  pendingParentId
    ? localePath({ path: "/admin/link-student-parent", query: { id: pendingParentId } })
    : localePath("/admin/pending-parents")
);

const {
  data: relationships,
  error: relError,
  refresh,
} = await useAsyncData(`student-relationships-${studentId}`, () =>
  $fetch(`/api/admin/student-relationships/${studentId}`)
);

const pendingParentInfo = ref<any>(null);
if (pendingParentId) {
  try {
    const res = await $fetch("/api/admin/pending-parents", {
      params: { id: pendingParentId },
    });
    if (Array.isArray(res) && res.length > 0) {
      pendingParentInfo.value = res[0];
    }
  } catch (e) {
    console.error("Failed to fetch pending parent info", e);
  }
}

const linking = ref(false);
const linkStudent = async () => {
  if (!confirm(t("admin.link_student.confirm_link"))) return;
  linking.value = true;
  try {
    await $fetch("/api/admin/link-parent-student", {
      method: "POST",
      body: { pendingParentId, studentId },
    });
    alert(t("admin.link_student.success_link"));
    navigateTo(localePath("/admin/pending-parents"));
  } catch {
    alert(t("admin.link_student.failed_link"));
  } finally {
    linking.value = false;
  }
};

const unlinkParent = async (parentId: string) => {
  if (!confirm(t("admin.link_student.confirm_unlink"))) return;
  try {
    await $fetch("/api/admin/unlink-parent-student", {
      method: "DELETE",
      body: { parentId, studentId },
    });
    alert(t("admin.link_student.success_unlink"));
    await refresh();
  } catch {
    alert(t("admin.link_student.failed_unlink"));
  }
};
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink :to="backPath" class="btn btn-circle btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold">{{ $t("admin.link_student.title") }}</h1>
    </div>

    <!-- Error state -->
    <div v-if="relError" class="alert alert-error mb-6">
      <span>{{ relError.message }}</span>
    </div>

    <template v-else-if="relationships">
      <!-- Student Card -->
      <div class="card bg-base-100 shadow-xl mb-6 border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-primary">
            {{ $t("admin.link_student.student_info") }}
          </h2>
          <div class="flex items-center gap-3">
            <div class="avatar">
              <div class="mask mask-squircle w-12 h-12">
                <img
                  :src="
                    relationships.student.image ||
                    'https://ui-avatars.com/api/?name=' + relationships.student.name
                  "
                />
              </div>
            </div>
            <div>
              <div class="font-bold">{{ relationships.student.name }}</div>
              <div class="text-sm opacity-70">{{ relationships.student.email }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Parent Card (only when pendingParentId present) -->
      <div
        v-if="pendingParentInfo"
        class="card bg-base-100 shadow-xl mb-6 border border-base-300"
      >
        <div class="card-body">
          <h2 class="card-title text-primary">
            {{ $t("admin.link_student.request_details") }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-bold text-lg mb-2">
                {{ $t("admin.link_student.parent_account") }}
              </h3>
              <div class="flex items-center gap-3">
                <div class="avatar placeholder">
                  <div class="bg-neutral text-neutral-content rounded-full w-12">
                    <span class="text-xl">{{
                      pendingParentInfo.parentName?.charAt(0) || "P"
                    }}</span>
                  </div>
                </div>
                <div>
                  <div class="font-bold">
                    {{ pendingParentInfo.parentName || "Unknown" }}
                  </div>
                  <div class="text-sm opacity-70">{{ pendingParentInfo.parentEmail }}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-lg mb-2">
                {{ $t("admin.link_student.requested_student_info") }}
              </h3>
              <div class="bg-base-200 p-4 rounded-lg">
                <div>
                  <span class="font-semibold">{{ $t("admin.link_student.name") }}</span>
                  {{ pendingParentInfo.studentName }}
                </div>
                <div>
                  <span class="font-semibold">{{ $t("admin.link_student.email") }}</span>
                  {{ pendingParentInfo.studentEmail }}
                </div>
              </div>
            </div>
          </div>
          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-primary"
              :disabled="linking"
              @click="linkStudent"
            >
              <span v-if="linking" class="loading loading-spinner loading-sm"></span>
              {{ $t("admin.link_student.table.link") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Linked Parents -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t("admin.link_student.linked_parents") }}</h2>

          <div
            v-if="relationships.parents.length === 0"
            class="text-center text-gray-500 my-4"
          >
            {{ $t("admin.link_student.no_linked_parents") }}
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("admin.link_student.table.avatar") }}</th>
                  <th>{{ $t("admin.link_student.table.name") }}</th>
                  <th>{{ $t("admin.link_student.table.email") }}</th>
                  <th>{{ $t("admin.link_student.table.linked_at") }}</th>
                  <th>{{ $t("admin.link_student.table.action") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="parent in relationships.parents" :key="parent.id">
                  <td>
                    <div class="avatar">
                      <div class="mask mask-squircle w-12 h-12">
                        <img
                          :src="
                            parent.image ||
                            'https://ui-avatars.com/api/?name=' + parent.name
                          "
                        />
                      </div>
                    </div>
                  </td>
                  <td>{{ parent.name }}</td>
                  <td>{{ parent.email }}</td>
                  <td>{{ new Date(parent.linkedAt).toLocaleDateString() }}</td>
                  <td>
                    <button
                      class="btn btn-sm btn-error"
                      @click="unlinkParent(parent.id)"
                    >
                      {{ $t("admin.link_student.table.unlink") }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 2: Verify the full flow manually**

  1. Go to `/admin/pending-parents`, click "Link Student" on any pending parent
  2. Search for a student — confirm button says "View"
  3. Click "View" — confirm landing on `/admin/link-student-parent/<studentId>?pendingParentId=<id>`
  4. Confirm pending parent card shows with "Link" button
  5. Click "Link" — confirm redirect to `/admin/pending-parents` and status updated
  6. Find a student with an existing linked parent; navigate to their detail page directly
  7. Confirm the linked parents table shows; click "Unlink" — confirm row disappears after refresh
  8. Confirm back button returns to the correct page

- [ ] **Step 3: Commit**

```bash
git add app/pages/admin/link-student-parent/[id].vue
git commit -m "feat(admin): add student-parent detail page with link and unlink"
```
