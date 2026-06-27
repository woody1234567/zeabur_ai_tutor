<script setup lang="ts">
interface Problem {
  id: number;
  title: string;
  difficulty: string;
  subject?: string | null;
  chapter?: string | null;
  grade?: string | null;
  source: string;
}

defineProps<{
  problem: Problem;
}>();

const localePath = useLocalePath();

const difficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
    default:
      return "badge-ghost";
  }
};
</script>

<template>
  <div
    class="card bg-base-100 shadow-md border border-base-200 w-full max-w-sm"
  >
    <div class="card-body p-4">
      <h3 class="card-title text-base">
        {{ problem.title }}
        <div
          class="badge badge-sm"
          :class="difficultyColor(problem.difficulty)"
        >
          {{ problem.difficulty }}
        </div>
      </h3>
      <div class="flex gap-1 flex-wrap mt-1">
        <span v-if="problem.subject" class="badge badge-info badge-outline badge-xs">{{ problem.subject }}</span>
        <span v-if="problem.chapter" class="badge badge-ghost badge-xs">{{ problem.chapter }}</span>
        <span v-if="problem.grade" class="badge badge-ghost badge-outline badge-xs">{{ problem.grade }}</span>
      </div>
      <p class="text-xs text-base-content/70">Source: {{ problem.source }}</p>
      <div class="card-actions justify-end mt-2">
        <StudentAddToListDropdown :problem-id="String(problem.id)" />
        <NuxtLink
          :to="localePath(`/student/problems/${problem.id}`)"
          class="btn btn-primary btn-sm"
        >
          Practice
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
