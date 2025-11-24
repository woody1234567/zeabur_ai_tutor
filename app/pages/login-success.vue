<script setup lang="ts">
import { useSession } from "../../lib/auth-client";

const session = useSession();
</script>

<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center">
    <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Login Successful!</h2>

        <div v-if="session.data" class="space-y-4">
          <div class="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>You have been successfully authenticated.</span>
          </div>

          <div class="stats shadow w-full">
            <div class="stat">
              <div class="stat-title">Role</div>
              <div class="stat-value text-primary">
                {{ session.data.user.role || "No Role" }}
              </div>
              <div class="stat-desc">User permission level</div>
            </div>
          </div>

          <div class="divider">User Details</div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">
                <span class="label-text font-bold">Name</span>
              </label>
              <div class="p-3 bg-base-200 rounded-lg">
                {{ session.data.user.name }}
              </div>
            </div>
            <div>
              <label class="label">
                <span class="label-text font-bold">Email</span>
              </label>
              <div class="p-3 bg-base-200 rounded-lg">
                {{ session.data.user.email }}
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="label">
                <span class="label-text font-bold">User ID</span>
              </label>
              <div class="p-3 bg-base-200 rounded-lg font-mono text-sm">
                {{ session.data.user.id }}
              </div>
            </div>
          </div>

          <div class="divider">Full Session Object (Debug)</div>

          <div class="mockup-code">
            <pre><code>{{ JSON.stringify(session.data, null, 2) }}</code></pre>
          </div>

          <div class="card-actions justify-end mt-6">
            <NuxtLink
              v-if="session.data.user.role === 'admin'"
              to="/admin"
              class="btn btn-primary"
              >Go to Admin</NuxtLink
            >
            <NuxtLink
              v-if="session.data.user.role === 'teacher'"
              to="/teacher"
              class="btn btn-primary"
              >Go to Teacher</NuxtLink
            >
            <NuxtLink
              v-if="session.data.user.role === 'student'"
              to="/student"
              class="btn btn-primary"
              >Go to Student</NuxtLink
            >
          </div>
        </div>

        <div v-else class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    </div>
  </div>
</template>
