<script setup lang="ts">
import { signOut } from "../../lib/auth-client";
const localePath = useLocalePath();

const handleLogout = async () => {
  await signOut();
  await navigateTo(localePath("/"));
};

const closeDrawer = () => {
  const drawerCheckbox = document.getElementById(
    "my-drawer-3"
  ) as HTMLInputElement;
  if (drawerCheckbox) {
    drawerCheckbox.checked = false;
  }
};
</script>

<template>
  <div class="drawer">
    <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="w-full navbar bg-base-100 shadow-md">
        <div class="flex-none lg:hidden">
          <label
            for="my-drawer-3"
            aria-label="open sidebar"
            class="btn btn-square btn-ghost"
          >
            <Icon name="heroicons-outline:menu" class="h-5 w-5" />
          </label>
        </div>
        <div class="flex-1 px-2 mx-2">
          <NuxtLink :to="localePath('/parent')" class="btn btn-ghost text-xl"
            >AI Tutor - Parent</NuxtLink
          >
        </div>
        <div class="flex-none hidden lg:block">
          <ul class="menu menu-horizontal px-1 items-center">
            <!-- Navbar menu content here -->
            <li>
              <NuxtLink :to="localePath('/parent/link-child')">{{
                $t("parent.link_child.nav_label")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/parent/profile')">{{
                $t("parent.layout.profile")
              }}</NuxtLink>
            </li>
            <li>
              <ThemeSwitcher />
            </li>
            <li>
              <LangSwitcher />
            </li>
            <li>
              <button @click="handleLogout" class="btn btn-secondary ml-2">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
      <!-- Page content here -->
      <div class="p-4 md:p-6">
        <slot />
      </div>
    </div>
    <div class="drawer-side z-50">
      <label
        for="my-drawer-3"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-200">
        <!-- Sidebar content here -->
        <li class="mb-4">
          <span class="text-xl font-bold px-4">Menu</span>
        </li>
        <li>
          <NuxtLink :to="localePath('/parent')" @click="closeDrawer"
            >Dashboard</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/parent/link-child')"
            @click="closeDrawer"
            >{{ $t("parent.link_child.nav_label") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/parent/profile')"
            @click="closeDrawer"
            >{{ $t("parent.layout.profile") }}</NuxtLink
          >
        </li>
        <li>
          <LangSwitcher />
        </li>
        <li>
          <ThemeSwitcher />
        </li>
        <li class="mt-auto">
          <button @click="handleLogout" class="btn btn-secondary btn-outline">
            Logout
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
