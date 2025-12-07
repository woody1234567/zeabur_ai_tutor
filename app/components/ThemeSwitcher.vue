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
        d="M12 4.5a1 1 0 0 0 1-1v-1a1 1 0 1 0-2 0v1a1 1 0 0 0 1 1ZM12 20.5a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1ZM4.22 4.22a1 1 0 0 0-1.41 1.41l.71.71a1 1 0 1 0 1.41-1.41l-.71-.71ZM19.78 19.78a1 1 0 0 0-1.41-1.41l-.71.71a1 1 0 0 0 1.41 1.41l.71-.71ZM4.5 12a1 1 0 0 0-1-1H2.5a1 1 0 1 0 0 2H3.5a1 1 0 0 0 1-1ZM21.5 11H20.5a1 1 0 0 0 0 2H21.5a1 1 0 0 0 0-2ZM4.22 19.78l.71-.71a1 1 0 1 0-1.41-1.41l-.71.71a1 1 0 1 0 1.41 1.41ZM19.78 4.22l-.71.71a1 1 0 1 0 1.41 1.41l.41-.41a1 1 0 0 0-1.41-1.41ZM12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5Z"
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
