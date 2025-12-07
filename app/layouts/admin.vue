<script setup lang="ts">
import { signOut } from "../../lib/auth-client";
const localePath = useLocalePath();

const handleLogout = async () => {
  await signOut();
  await navigateTo(localePath("/"));
};
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-md">
      <div class="flex-1">
        <NuxtLink :to="localePath('/admin')" class="btn btn-ghost text-xl">{{
          $t("admin.layout.title")
        }}</NuxtLink>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li>
            <ThemeSwitcher />
          </li>
          <li>
            <LangSwitcher />
          </li>
          <li>
            <NuxtLink class="btn btn-ghost" :to="localePath('/admin/')">{{
              $t("admin.layout.home")
            }}</NuxtLink>
          </li>
          <li>
            <NuxtLink class="btn btn-ghost" :to="localePath('/admin/users')">{{
              $t("admin.layout.users")
            }}</NuxtLink>
          </li>
          <li>
            <NuxtLink
              class="btn btn-ghost"
              :to="localePath('/admin/pending-parents')"
              >{{ $t("admin.layout.link_student_parent") }}</NuxtLink
            >
          </li>
          <li>
            <button @click="handleLogout" class="btn btn-primary">
              {{ $t("admin.layout.logout") }}
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
