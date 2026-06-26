<script setup lang="ts">
const localePath = useLocalePath();

const closeDrawer = () => {
  const drawerCheckbox = document.getElementById(
    "default-drawer"
  ) as HTMLInputElement;
  if (drawerCheckbox) {
    drawerCheckbox.checked = false;
  }
};
</script>

<template>
  <div class="drawer">
    <input id="default-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-start">
          <div class="flex-none lg:hidden">
            <label
              for="default-drawer"
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
        <div class="navbar-end gap-2 items-center hidden lg:flex">
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
            Copyright © {{ new Date().getFullYear() }} - All right reserved by
            AI Tutor Team
          </p>
        </aside>
      </footer>
    </div>

    <div class="drawer-side z-50">
      <label
        for="default-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-200">
        <li class="mb-4">
          <span class="text-xl font-bold px-4">{{
            $t("landing.title")
          }}</span>
        </li>
        <li>
          <NuxtLink :to="localePath('/about')" @click="closeDrawer">
            {{ $t("about.title") }}
          </NuxtLink>
        </li>
        <li>
          <LangSwitcher />
        </li>
        <li>
          <ThemeSwitcher />
        </li>
        <li class="mt-4">
          <NuxtLink
            :to="localePath('/auth')"
            @click="closeDrawer"
            class="btn btn-primary"
            >{{ $t("auth.title") }}</NuxtLink
          >
        </li>
      </ul>
    </div>
  </div>
</template>
