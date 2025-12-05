<script setup lang="ts">
import { signOut } from "../../lib/auth-client";

const handleLogout = async () => {
  await signOut();
  await navigateTo("/");
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
          <NuxtLink to="/student" class="btn btn-ghost text-xl">{{
            $t("student.layout.title")
          }}</NuxtLink>
        </div>
        <div class="flex-none hidden lg:block">
          <ul class="menu menu-horizontal px-1">
            <!-- Navbar menu content here -->
            <li>
              <details>
                <summary class="list-none marker:content-none">
                  {{ $t("student.layout.external_links") }}
                </summary>
                <ul class="bg-base-100 rounded-t-none p-2">
                  <li>
                    <NuxtLink to="https://physimhub.studywithwoody.site/">{{
                      $t("student.layout.physimhub")
                    }}</NuxtLink>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <NuxtLink to="/student/problems">{{
                $t("student.layout.testbank")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/student/classrooms">{{
                $t("student.layout.classrooms")
              }}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/student/homeworks">{{
                $t("student.layout.homework")
              }}</NuxtLink>
            </li>
            <li>
              <button @click="handleLogout" class="btn btn-secondary ml-2">
                {{ $t("student.layout.logout") }}
              </button>
            </li>
            <li>
              <LangSwitcher />
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
          <NuxtLink to="/student" @click="closeDrawer">{{
            $t("student.layout.dashboard")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/student/problems" @click="closeDrawer">{{
            $t("student.layout.testbank")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/student/classrooms" @click="closeDrawer">{{
            $t("student.layout.classrooms")
          }}</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/student/homeworks" @click="closeDrawer">{{
            $t("student.layout.homework")
          }}</NuxtLink>
        </li>
        <li class="mt-auto">
          <button @click="handleLogout" class="btn btn-secondary btn-outline">
            {{ $t("student.layout.logout") }}
          </button>
        </li>
        <li>
          <LangSwitcher />
        </li>
      </ul>
    </div>
  </div>
</template>
