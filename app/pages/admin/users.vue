<script setup lang="ts">
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import UserSearchBar from "~/components/admin/UserSearchBar.vue";

definePageMeta({
  layout: "admin",
});

const client = createAuthClient({
  plugins: [adminClient()],
});

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  createdAt: Date;
  emailVerified: boolean;
  requestedRole?: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const roleFilter = ref("");

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/users-with-role-requests", {
      params: {
        search: searchQuery.value,
        role: roleFilter.value,
      },
    });
    console.log("API Response:", res);
    if (res.users) {
      users.value = res.users as unknown as User[];
      console.log("Set users:", users.value);
    }
  } catch (error) {
    console.error("Failed to fetch users", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchUsers();
};

watch(roleFilter, () => {
  fetchUsers();
});

const updateUserRole = async (userId: string, newRole: string) => {
  try {
    await client.admin.setRole({
      userId,
      role: newRole as any,
    });
    // Refresh list
    await fetchUsers();
  } catch (error) {
    console.error("Failed to update role", error);
    alert("Failed to update role");
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">User Management</h1>

    <div class="mb-6">
      <UserSearchBar
        v-model="searchQuery"
        v-model:roleFilter="roleFilter"
        @search="handleSearch"
      />
    </div>

    <div v-if="loading" class="flex justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Requested Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar">
                  <div class="mask mask-squircle w-12 h-12">
                    <img
                      :src="
                        user.image ||
                        'https://ui-avatars.com/api/?name=' + user.name
                      "
                      alt="Avatar"
                    />
                  </div>
                </div>
                <div>
                  <div class="font-bold">{{ user.name }}</div>
                </div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge badge-ghost badge-sm">{{
                user.role || "No Role"
              }}</span>
            </td>
            <td>
              <span
                v-if="user.requestedRole"
                class="badge badge-primary badge-sm"
                >{{ user.requestedRole }}</span
              >
              <span v-else class="text-gray-400 text-sm">-</span>
            </td>
            <td>
              <div class="flex items-center gap-2 h-full">
                <button
                  class="btn btn-xs btn-outline btn-info"
                  @click="updateUserRole(user.id, 'student')"
                  :disabled="user.role === 'student'"
                >
                  Student
                </button>
                <button
                  class="btn btn-xs btn-outline btn-success"
                  @click="updateUserRole(user.id, 'teacher')"
                  :disabled="user.role === 'teacher'"
                >
                  Teacher
                </button>
                <button
                  class="btn btn-xs btn-outline btn-secondary"
                  @click="updateUserRole(user.id, 'parent')"
                  :disabled="user.role === 'parent'"
                >
                  Parent
                </button>
                <button
                  class="btn btn-xs btn-outline btn-warning"
                  @click="updateUserRole(user.id, 'admin')"
                  :disabled="user.role === 'admin'"
                >
                  Admin
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
