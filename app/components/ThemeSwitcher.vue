<script setup lang="ts">
const themes = ["light", "dark", "retro", "halloween", "dracula", "valentine"];
const theme = useState<string>("theme", () => "dark");

function setTheme(newTheme: string) {
  theme.value = newTheme;
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

onMounted(() => {
  const saved = localStorage.getItem("theme") || "dark";
  setTheme(saved);
});
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
      <Icon name="heroicons-solid:swatch" class="w-5 h-5" />
      <span class="hidden sm:inline capitalize">{{ theme }}</span>
      <Icon name="heroicons-solid:chevron-down" class="w-3 h-3" />
    </div>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-44 mt-2"
    >
      <li v-for="t in themes" :key="t">
        <button
          class="capitalize justify-between"
          :class="{ active: theme === t }"
          @click="setTheme(t)"
        >
          {{ t }}
          <span
            class="flex gap-0.5"
            :data-theme="t"
          >
            <span class="w-2 h-4 rounded bg-primary" />
            <span class="w-2 h-4 rounded bg-secondary" />
            <span class="w-2 h-4 rounded bg-accent" />
            <span class="w-2 h-4 rounded bg-neutral" />
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
