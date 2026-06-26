<script setup lang="ts">
import UserSearchBar from "~/components/admin/UserSearchBar.vue";

definePageMeta({
  layout: "admin",
});
const localePath = useLocalePath();
const route = useRoute();

// --- Pending parents list ---
interface PendingParent {
  id: string;
  parentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  createdAt: string;
  parentName: string | null;
  parentEmail: string | null;
}

const pendingParents = ref<PendingParent[]>([]);
const listLoading = ref(true);
const listSearch = ref("");

let debounceTimer: ReturnType<typeof setTimeout>;

const fetchPendingParents = async () => {
  listLoading.value = true;
  try {
    const res = await $fetch("/api/admin/pending-parents", {
      query: { search: listSearch.value },
    });
    pendingParents.value = res as PendingParent[];
  } catch (error) {
    console.error("Failed to fetch pending parents", error);
  } finally {
    listLoading.value = false;
  }
};

watch(listSearch, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchPendingParents, 300);
});

onMounted(fetchPendingParents);

// --- Pending parent info (reactive to ?id= query param) ---
const pendingParentId = computed(() => route.query.id as string | undefined);
const pendingParentInfo = ref<any>(null);

const fetchPendingParentInfo = async () => {
  if (!pendingParentId.value) {
    pendingParentInfo.value = null;
    return;
  }
  try {
    const res = await $fetch("/api/admin/pending-parents", {
      params: { id: pendingParentId.value },
    });
    if (Array.isArray(res) && res.length > 0) {
      pendingParentInfo.value = res[0];
    }
  } catch (error) {
    console.error("Failed to fetch pending parent info", error);
  }
};

watch(pendingParentId, fetchPendingParentInfo, { immediate: true });

// --- Student search ---
const searchQuery = ref("");
const roleFilter = ref("student");
const searchResults = ref<any[]>([]);
const loading = ref(false);

const handleSearch = async () => {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/users/search", {
      params: {
        q: searchQuery.value,
        role: roleFilter.value,
      },
    });
    searchResults.value = res as any[];
  } catch (error) {
    console.error("Search failed", error);
  } finally {
    loading.value = false;
  }
};

const viewStudent = (studentId: string) => {
  navigateTo(
    localePath({
      path: `/admin/link-student-parent/${studentId}`,
      query: pendingParentId.value ? { pendingParentId: pendingParentId.value } : {},
    })
  );
};
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">
      {{ $t("admin.pending_parents.title") }}
    </h1>

    <!-- Pending Parent Requests List -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">{{ $t("admin.pending_parents.title") }}</h2>
          <input
            v-model="listSearch"
            type="text"
            :placeholder="$t('admin.pending_parents.search_placeholder')"
            class="input input-bordered w-full max-w-xs"
          />
        </div>

        <div v-if="listLoading" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ $t("admin.pending_parents.table.parent") }}</th>
                <th>{{ $t("admin.pending_parents.table.student_info") }}</th>
                <th>{{ $t("admin.pending_parents.table.status") }}</th>
                <th>{{ $t("admin.pending_parents.table.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pendingParents" :key="item.id">
                <td>
                  <div class="font-bold">{{ item.parentName || "Unknown" }}</div>
                  <div class="text-sm opacity-50">
                    {{ item.parentEmail || "Unknown" }}
                  </div>
                </td>
                <td>
                  <div class="font-bold">{{ item.studentName }}</div>
                  <div class="text-sm opacity-50">{{ item.studentEmail }}</div>
                </td>
                <td>
                  <span
                    :class="{
                      badge: true,
                      'badge-warning': item.status === 'pending',
                      'badge-success': item.status === 'approved',
                      'badge-error': item.status === 'rejected',
                    }"
                    >{{ item.status }}</span
                  >
                </td>
                <td>
                  <NuxtLink
                    v-if="item.status === 'pending'"
                    class="btn btn-xs btn-success text-white"
                    :to="
                      localePath({
                        path: '/admin/link-student-parent',
                        query: { id: item.id },
                      })
                    "
                  >
                    {{ $t("admin.pending_parents.table.link") }}
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pending Parent Info Card (shown when ?id= in query) -->
    <div
      v-if="pendingParentInfo"
      class="card bg-base-100 shadow-xl mb-8 border border-base-300"
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
                <div class="text-sm opacity-70">
                  {{ pendingParentInfo.parentEmail }}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-bold text-lg mb-2">
              {{ $t("admin.link_student.requested_student_info") }}
            </h3>
            <div class="bg-base-200 p-4 rounded-lg">
              <div>
                <span class="font-semibold">{{
                  $t("admin.link_student.name")
                }}</span>
                {{ pendingParentInfo.studentName }}
              </div>
              <div>
                <span class="font-semibold">{{
                  $t("admin.link_student.email")
                }}</span>
                {{ pendingParentInfo.studentEmail }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Search -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title">
          {{ $t("admin.link_student.search_student") }}
        </h2>
        <UserSearchBar
          v-model="searchQuery"
          v-model:roleFilter="roleFilter"
          :lock-role="true"
          @search="handleSearch"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="searchResults.length > 0" class="overflow-x-auto">
      <table class="table w-full bg-base-100 shadow-lg rounded-box">
        <thead>
          <tr>
            <th>{{ $t("admin.link_student.table.avatar") }}</th>
            <th>{{ $t("admin.link_student.table.name") }}</th>
            <th>{{ $t("admin.link_student.table.email") }}</th>
            <th>{{ $t("admin.link_student.table.role") }}</th>
            <th>{{ $t("admin.link_student.table.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in searchResults" :key="user.id">
            <td>
              <div class="avatar">
                <div class="mask mask-squircle w-12 h-12">
                  <img
                    :src="
                      user.image ||
                      'https://ui-avatars.com/api/?name=' + user.name
                    "
                  />
                </div>
              </div>
            </td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge badge-ghost">{{ user.role }}</span>
            </td>
            <td>
              <button
                class="btn btn-sm btn-primary"
                @click="viewStudent(user.id)"
              >
                {{ $t("admin.link_student.table.view") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="!loading && searchQuery"
      class="text-center text-gray-500 my-8"
    >
      {{ $t("admin.link_student.no_users_found") }}
    </div>
  </div>
</template>
