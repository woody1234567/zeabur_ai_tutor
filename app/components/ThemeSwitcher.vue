<script setup lang="ts">
const theme = useState<string>("theme", () => "dark");

onMounted(() => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  theme.value = savedTheme;
  document.documentElement.setAttribute("data-theme", savedTheme);
});

const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
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
    <svg
      class="swap-on fill-current w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,4.93,1,1,0,0,0,5.64,7.05Zm15.61,6.34H18.4a1,1,0,0,0,0,2h2.86a1,1,0,0,0,0-2Zm-2.17,5a1,1,0,0,0-1.41,0l-.71.71a1,1,0,0,0,1.41,1.41l.71-.71A1,1,0,0,0,19.08,18.4ZM12,18.65A1,1,0,0,0,11,19.65V21a1,1,0,0,0,2,0V19.65A1,1,0,0,0,12,18.65Zm6.34-11a1,1,0,0,0-1.41-1.41l-.71.71a1,1,0,0,0,1.41,1.41Zm-9.1,2.57a6,6,0,1,0,6,6A6,6,0,0,0,9.24,10.22Z"
      />
    </svg>

    <!-- moon icon -->
    <svg
      class="swap-off fill-current w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
      />
    </svg>
  </label>
</template>
