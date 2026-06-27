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
        <StudentFavoriteButton v-if="problemId" :problem-id="problemId" :is-favorite="isFavorite" />
        <StudentAddToListDropdown v-if="problemId" :problem-id="problemId" />
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
