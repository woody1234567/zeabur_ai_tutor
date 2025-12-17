<script setup lang="ts">
import { signOut } from "../../lib/auth-client";
const { locale } = useI18n();
const localePath = useLocalePath();
console.log(locale.value);
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
            :to="localePath('/student')"
            class="btn btn-ghost text-xl"
            >{{ $t("student.layout.title") }}</NuxtLink
          >
        </div>
        <div class="flex-none hidden lg:block">
          <ul class="menu menu-horizontal px-1 items-center">
            <li>
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost">
                  {{ $t("student.layout.external_links") }}
                  <Icon name="heroicons-solid:chevron-down" />
                </div>
                <ul
                  tabindex="0"
                  class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <NuxtLink to="https://physimhub.studywithwoody.site/">{{
                      $t("student.layout.physimhub")
                    }}</NuxtLink>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/problems')">{{
                $t("student.layout.testbank")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/favorites')">{{
                $t("student.layout.favorites")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/wrong')">{{
                $t("student.layout.wrong")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/classrooms')">{{
                $t("student.layout.classrooms")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/homeworks')">{{
                $t("student.layout.homework")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/materials')">{{
                $t("student.layout.materials")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/student/ai-chat')">AI Chat</NuxtLink>
            </li>
            <li>
              <button
                @click="handleLogout"
                class="btn btn-secondary ml-2 mr-2 mt-2 mb-2 p-2"
              >
                {{ $t("student.layout.logout") }}
              </button>
            </li>
            <li>
              <LangSwitcher />
            </li>
            <li>
              <ThemeSwitcher />
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
          <span class="text-xl font-bold px-4">{{
            $t("student.layout.menu")
          }}</span>
        </li>
        <li>
          <NuxtLink :to="localePath('/student')" @click="closeDrawer">{{
            $t("student.layout.dashboard")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink
            :to="localePath('/student/problems')"
            @click="closeDrawer"
            >{{ $t("student.layout.testbank") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/student/classrooms')"
            @click="closeDrawer"
            >{{ $t("student.layout.classrooms") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink
            :to="localePath('/student/homeworks')"
            @click="closeDrawer"
            >{{ $t("student.layout.homework") }}</NuxtLink
          >
        </li>
        <li>
          <NuxtLink :to="localePath('/student/ai-chat')" @click="closeDrawer"
            >AI Chat</NuxtLink
          >
        </li>
        <li class="mt-auto">
          <button @click="handleLogout" class="btn btn-secondary btn-outline">
            {{ $t("student.layout.logout") }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
