<script setup lang="ts">
import { signOut } from "../../lib/auth-client";
const localePath = useLocalePath();

const handleLogout = async () => {
  await signOut();
  await navigateTo(localePath("/"));
};

const closeDrawer = () => {
  const drawerCheckbox = document.getElementById(
    "admin-drawer"
  ) as HTMLInputElement;
  if (drawerCheckbox) {
    drawerCheckbox.checked = false;
  }
};
</script>

<template>
  <div class="drawer">
    <input id="admin-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="w-full navbar bg-base-100 shadow-md">
        <div class="flex-none lg:hidden">
          <label
            for="admin-drawer"
            aria-label="open sidebar"
            class="btn btn-square btn-ghost"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block w-6 h-6 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </label>
        </div>
        <div class="flex-1 px-2 mx-2">
          <NuxtLink
            :to="localePath('/admin')"
            class="btn btn-ghost text-xl"
            >{{ $t("admin.layout.title") }}</NuxtLink
          >
        </div>
        <div class="flex-none hidden lg:block">
          <ul class="menu menu-horizontal px-1 items-center">
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
                >{{ $t("admin.layout.linking") }}</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                class="btn btn-ghost"
                :to="localePath('/admin/link-student-parent')"
                >{{ $t("admin.layout.link_student_parent") }}</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                class="btn btn-ghost"
                :to="localePath('/admin/ai-interaction-logs')"
                >{{ $t("admin.layout.ai_logs") }}</NuxtLink
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
      <!-- Page content -->
      <div class="p-4">
        <slot />
      </div>
    </div>
    <div class="drawer-side z-50">
      <label
        for="admin-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-200">
        <li class="mb-4">
          <span class="text-xl font-bold px-4">{{
            $t("admin.layout.title")
          }}</span>
        </li>
        <li>
          <NuxtLink :to="localePath('/admin/')" @click="closeDrawer">{{
            $t("admin.layout.home")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/admin/users')" @click="closeDrawer">{{
            $t("admin.layout.users")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink
            :to="localePath('/admin/pending-parents')"
            @click="closeDrawer"
            >{{ $t("admin.layout.linking") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/admin/link-student-parent')"
            @click="closeDrawer"
            >{{ $t("admin.layout.link_student_parent") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/admin/ai-interaction-logs')"
            @click="closeDrawer"
            >{{ $t("admin.layout.ai_logs") }}</NuxtLink
          >
        </li>
        <li>
          <LangSwitcher />
        </li>
        <li>
          <ThemeSwitcher />
        </li>
        <li class="mt-auto">
          <button @click="handleLogout" class="btn btn-primary btn-outline">
            {{ $t("admin.layout.logout") }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
