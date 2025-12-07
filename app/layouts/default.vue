<script setup lang="ts">
const localePath = useLocalePath();
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navbar -->
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabindex="0"
            class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <LangSwitcher />
            </li>
            <li>
              <NuxtLink :to="localePath('/about')">
                {{ $t("about.title") }}</NuxtLink
              >
            </li>
          </ul>
        </div>
        <NuxtLink :to="localePath('/')" class="btn btn-ghost text-xl">{{
          $t("landing.title")
        }}</NuxtLink>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li>
            <NuxtLink :to="localePath('/about')">
              {{ $t("about.title") }}</NuxtLink
            >
          </li>
        </ul>
      </div>
      <div class="navbar-end gap-2">
        <ThemeSwitcher />
        <LangSwitcher />
        <NuxtLink :to="localePath('/auth')" class="btn btn-primary">{{
          $t("auth.title")
        }}</NuxtLink>
      </div>
    </div>

    <!-- Page Content -->
    <main class="flex-grow">
      <slot />
    </main>

    <!-- Footer -->
    <footer
      class="footer footer-center p-10 bg-base-200 text-base-content rounded"
    >
      <nav class="grid grid-flow-col gap-4">
        <NuxtLink :to="localePath('/about')" class="link link-hover"
          >About us</NuxtLink
        >
        <a class="link link-hover">Contact</a>
        <a class="link link-hover">Privacy Policy</a>
      </nav>
      <aside>
        <p>
          Copyright © {{ new Date().getFullYear() }} - All right reserved by AI
          Tutor Team
        </p>
      </aside>
    </footer>
  </div>
</template>
