<script setup lang="ts">
const props = defineProps<{
  problemId: string;
  isFavorite?: boolean;
}>();

const localIsFavorite = ref(props.isFavorite ?? false);
const isToggling = ref(false);

const toggle = async () => {
  if (isToggling.value) return;
  isToggling.value = true;
  try {
    if (localIsFavorite.value) {
      await $fetch("/api/favorite", { method: "DELETE", body: { problemId: props.problemId } });
      localIsFavorite.value = false;
    } else {
      await $fetch("/api/favorite", { method: "POST", body: { problemId: props.problemId } });
      localIsFavorite.value = true;
    }
  } catch (e) {
    console.error("Failed to toggle favorite", e);
  } finally {
    isToggling.value = false;
  }
};
</script>

<template>
  <button
    class="btn btn-ghost btn-sm btn-circle"
    :class="localIsFavorite ? 'text-warning' : 'text-base-content/40'"
    :title="localIsFavorite ? $t('student.problems.remove_from_favorites') : $t('student.problems.add_to_favorites')"
    :disabled="isToggling"
    @click="toggle"
  >
    <span v-if="isToggling" class="loading loading-spinner loading-xs"></span>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      :fill="localIsFavorite ? 'currentColor' : 'none'"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  </button>
</template>
