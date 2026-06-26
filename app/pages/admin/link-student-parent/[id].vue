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
