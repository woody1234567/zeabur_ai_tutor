<script setup lang="ts">
import { themeChange } from "theme-change";

// We still keep this state for other components (like the robot) to react to
const theme = useState<string>("theme", () => "dark");

onMounted(() => {
  // Initialize theme-change
  themeChange(false);

  // Sync initial state from DOM (theme-change might have set it or we default)
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  theme.value = currentTheme;

  // Watch for changes on the html element (attribute p) to update our Nuxt state
  // This ensures if theme-change updates the DOM, our state reflects it
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-theme"
      ) {
        const newTheme = document.documentElement.getAttribute("data-theme");
        if (newTheme) {
          theme.value = newTheme;
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});
</script>

<template>
  <label
    class="swap swap-rotate hover:scale-110 active:scale-95 transition-all"
  >
    <!-- 
      theme-change library uses data-toggle-theme to toggle between specified themes.
      No click handler needed, the library handles it.
    -->
    <input
      type="checkbox"
      data-toggle-theme="dark,retro"
      data-act-class="ACTIVECLASS"
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
