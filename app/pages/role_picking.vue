<script setup lang="ts">
import { authClient } from "../../lib/auth-client";

const selectedRole = ref<"teacher" | "student" | "parent" | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async () => {
  if (!selectedRole.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await $fetch("/api/user/role-request", {
      method: "POST",
      body: { role: selectedRole.value },
    });
    navigateTo("/pending");
  } catch (e: any) {
    console.error("Failed to submit role request", e);
    error.value = e.statusMessage || "Failed to submit role request";
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        navigateTo("/");
      },
    },
  });
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold mb-6 justify-center">
          Select Your Role
        </h2>
        <p class="text-center text-base-content/70 mb-6">
          Please select the role you would like to apply for.
        </p>

        <div class="form-control gap-4">
          <label
            class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
            :class="{
              'border-primary bg-primary/10': selectedRole === 'teacher',
            }"
          >
            <span class="label-text font-medium">Teacher</span>
            <input
              type="radio"
              name="role"
              class="radio radio-primary"
              value="teacher"
              v-model="selectedRole"
            />
          </label>

          <label
            class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
            :class="{
              'border-primary bg-primary/10': selectedRole === 'student',
            }"
          >
            <span class="label-text font-medium">Student</span>
            <input
              type="radio"
              name="role"
              class="radio radio-primary"
              value="student"
              v-model="selectedRole"
            />
          </label>

          <label
            class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
            :class="{
              'border-primary bg-primary/10': selectedRole === 'parent',
            }"
          >
            <span class="label-text font-medium">Parent</span>
            <input
              type="radio"
              name="role"
              class="radio radio-primary"
              value="parent"
              v-model="selectedRole"
            />
          </label>
        </div>

        <div v-if="error" class="alert alert-error mt-4">
          <span>{{ error }}</span>
        </div>

        <div class="card-actions justify-end mt-6 flex-col gap-2">
          <button
            class="btn btn-primary w-full"
            :disabled="!selectedRole || isLoading"
            @click="handleSubmit"
          >
            <span v-if="isLoading" class="loading loading-spinner"></span>
            Submit Request
          </button>
          <button class="btn btn-ghost w-full" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
