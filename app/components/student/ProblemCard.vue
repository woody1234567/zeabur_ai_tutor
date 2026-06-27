<script setup lang="ts">
interface Problem {
  title: string;
  content: string;
  imageUrl: string | null;
}

const props = defineProps<{
  problem: Problem;
  currentIndex: number;
  totalProblems: number;
  problemId?: string;
  isFavorite?: boolean;
}>();

defineEmits<{
  (e: "prev"): void;
  (e: "next"): void;
}>();

const localIsFavorite = ref(props.isFavorite ?? false);
const isTogglingFavorite = ref(false);

const toggleFavorite = async () => {
  if (!props.problemId || isTogglingFavorite.value) return;

  isTogglingFavorite.value = true;
  try {
    if (localIsFavorite.value) {
      await $fetch("/api/favorite", {
        method: "DELETE",
        body: { problemId: props.problemId },
      });
      localIsFavorite.value = false;
    } else {
      await $fetch("/api/favorite", {
        method: "POST",
        body: { problemId: props.problemId },
      });
      localIsFavorite.value = true;
    }
  } catch (e) {
    console.error("Failed to toggle favorite", e);
  } finally {
    isTogglingFavorite.value = false;
  }
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl relative">
    <!-- Navigation Buttons on Card -->
    <div class="absolute top-4 left-4 z-10">
      <button
        v-if="currentIndex > 0"
        @click="$emit('prev')"
        class="btn btn-circle btn-sm btn-ghost"
        :title="$t('components.student.problem_card.previous_problem')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
    <div class="absolute top-4 right-4 z-10">
      <button
        v-if="currentIndex < totalProblems - 1"
        @click="$emit('next')"
        class="btn btn-circle btn-sm btn-ghost"
        :title="$t('components.student.problem_card.next_problem')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    <div class="card-body pt-12 p-4 md:p-8 md:pt-12">
      <div class="flex items-start justify-between gap-2">
        <h2 class="card-title text-2xl flex-1 justify-center">
          {{ problem.title }}
        </h2>
        <button
          v-if="problemId"
          class="btn btn-ghost btn-sm btn-circle flex-none"
          :class="localIsFavorite ? 'text-warning' : 'text-base-content/40'"
          :title="localIsFavorite ? $t('student.problems.remove_from_favorites') : $t('student.problems.add_to_favorites')"
          :disabled="isTogglingFavorite"
          @click="toggleFavorite"
        >
          <span v-if="isTogglingFavorite" class="loading loading-spinner loading-xs"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="localIsFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
      <MarkdownRenderer :content="problem.content" class="py-4 text-lg" />

      <!-- Image -->
      <div v-if="problem.imageUrl" class="my-4 flex justify-center">
        <img
          :src="problem.imageUrl"
          :alt="$t('components.student.problem_card.problem_image')"
          class="max-h-96 rounded-lg shadow-md object-contain"
        />
      </div>

      <div class="divider"></div>

      <!-- Slot for Choices and Actions -->
      <slot></slot>
    </div>
  </div>
</template>
