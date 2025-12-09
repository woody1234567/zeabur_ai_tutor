<script setup lang="ts">
const theme = useState<string>("theme", () => "dark");

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "retro") {
    theme.value = "retro";
  } else {
    theme.value = "dark";
  }
  document.documentElement.setAttribute("data-theme", theme.value);
});

const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "retro" : "dark";
  document.documentElement.setAttribute("data-theme", theme.value);
  localStorage.setItem("theme", theme.value);
};
</script>

<template>
  <label
    class="swap swap-rotate hover:scale-110 active:scale-95 transition-all"
  >
    <!-- this hidden checkbox controls the state -->
    <input
      type="checkbox"
      class="theme-controller"
      :checked="theme === 'dark'"
      @change="toggleTheme"
    />

    <!-- sun icon -->
    <Icon
      class="swap-on fill-current w-6 h-6"
      name="heroicons-solid:sun"
    ></Icon>

    <!-- moon icon -->
    <Icon
      class="swap-off fill-current w-6 h-6"
      name="heroicons-solid:moon"
    ></Icon>
  </label>
</template>
