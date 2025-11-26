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
        <NuxtLink to="/student" class="btn btn-ghost text-xl"
          >AI Tutor - Student</NuxtLink
        >
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li>
            <NuxtLink class="btn btn-ghost" to="/student/problems"
              >Testbank</NuxtLink
            >
          </li>
          <li>
            <NuxtLink class="btn btn-ghost" to="/student/classrooms"
              >Classrooms</NuxtLink
            >
          </li>
          <li>
            <NuxtLink class="btn btn-ghost" to="/student/homeworks"
              >Homework</NuxtLink
            >
          </li>
          <li>
            <button @click="handleLogout" class="btn btn-secondary">
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
