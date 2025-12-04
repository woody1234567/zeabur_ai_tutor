<script setup lang="ts">
import UserSearchBar from "~/components/admin/UserSearchBar.vue";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const pendingParentId = route.query.id as string;

const searchQuery = ref("");
const roleFilter = ref("student"); // Default to searching students
const searchResults = ref<any[]>([]);
const loading = ref(false);
const pendingParentInfo = ref<any>(null);

const fetchPendingParentInfo = async () => {
  if (!pendingParentId) return;
  try {
    const res = await $fetch("/api/admin/pending-parents", {
      params: { id: pendingParentId },
    });
    if (Array.isArray(res) && res.length > 0) {
      pendingParentInfo.value = res[0];
    }
  } catch (error) {
    console.error("Failed to fetch pending parent info", error);
  }
};

onMounted(() => {
  fetchPendingParentInfo();
});

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

const linkStudent = async (studentId: string) => {
  if (!confirm("Are you sure you want to link this student to the parent?"))
    return;

  // TODO: Implement the actual linking logic API call
  console.log(
    "Linking student",
    studentId,
    "to pending parent",
    pendingParentId
  );
  alert("Linking functionality to be implemented. Student ID: " + studentId);
};
</script>

<template>
  <div class="p-8">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin/pending-parents" class="btn btn-circle btn-ghost">
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
      <h1 class="text-2xl font-bold">Link Student to Parent</h1>
    </div>

    <div
      v-if="pendingParentInfo"
      class="card bg-base-100 shadow-xl mb-8 border border-base-300"
    >
      <div class="card-body">
        <h2 class="card-title text-primary">Request Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-bold text-lg mb-2">Parent Account</h3>
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
            <h3 class="font-bold text-lg mb-2">Requested Student Info</h3>
            <div class="bg-base-200 p-4 rounded-lg">
              <div>
                <span class="font-semibold">Name:</span>
                {{ pendingParentInfo.studentName }}
              </div>
              <div>
                <span class="font-semibold">Email:</span>
                {{ pendingParentInfo.studentEmail }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title">Search Student</h2>
        <UserSearchBar
          v-model="searchQuery"
          v-model:roleFilter="roleFilter"
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
            <th>Avatar</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
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
                @click="linkStudent(user.id)"
              >
                Link
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
      No users found matching your search.
    </div>
  </div>
</template>
