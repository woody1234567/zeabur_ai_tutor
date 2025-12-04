<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

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
const loading = ref(true);
const search = ref("");

let debounceTimer: NodeJS.Timeout;

const fetchPendingParents = async () => {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/pending-parents", {
      query: { search: search.value },
    });
    pendingParents.value = res as PendingParent[];
  } catch (error) {
    console.error("Failed to fetch pending parents", error);
  } finally {
    loading.value = false;
  }
};

watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchPendingParents();
  }, 300);
});

const updateStatus = async (id: string, status: string) => {
  try {
    await $fetch("/api/admin/pending-parents", {
      method: "PUT",
      body: { id, status },
    });
    await fetchPendingParents();
  } catch (error) {
    console.error("Failed to update status", error);
    alert("Failed to update status");
  }
};

onMounted(() => {
  fetchPendingParents();
});
</script>

<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Pending Parent Links</h1>
      <input
        v-model="search"
        type="text"
        placeholder="Search by name, email or status..."
        class="input input-bordered w-full max-w-xs"
      />
    </div>

    <div v-if="loading" class="flex justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Parent</th>
            <th>Student Info (Provided)</th>
            <th>Status</th>
            <th>Actions</th>
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
              <div class="flex gap-2" v-if="item.status === 'pending'">
                <NuxtLink
                  class="btn btn-xs btn-success text-white"
                  :to="'/admin/link-student-parent?id=' + item.id"
                >
                  link
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
