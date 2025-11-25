<script setup lang="ts">
import { signOut } from "../../lib/auth-client";

const handleLogout = async () => {
  await signOut();
  await navigateTo("/");
};
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-md">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost text-xl"
          >AI Tutor - Admin</NuxtLink
        >
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li><NuxtLink class="btn btn-ghost" to="/admin/">Home</NuxtLink></li>
          <li>
            <NuxtLink class="btn btn-ghost" to="/admin/users">Users</NuxtLink>
          </li>
          <li>
            <button @click="handleLogout" class="btn btn-primary">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>
