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

const props = defineProps<{
  problem: Problem;
  understood?: boolean;
}>();

const localePath = useLocalePath();

const localUnderstood = ref(props.understood ?? false);
const isTogglingUnderstood = ref(false);

const toggleUnderstood = async () => {
  if (isTogglingUnderstood.value) return;
  isTogglingUnderstood.value = true;
  try {
    const result = await $fetch<{ understood: boolean }>(
      "/api/student/problems/understood",
      { method: "POST", body: { problemId: props.problem.id } }
    );
    localUnderstood.value = result.understood;
  } catch {
    // ignore
  } finally {
    isTogglingUnderstood.value = false;
  }
};

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
      <div class="card-actions justify-end mt-2 flex-wrap">
        <StudentAddToListDropdown :problem-id="String(problem.id)" />
        <button
          v-if="understood !== undefined"
          class="btn btn-sm gap-1 transition-all duration-300"
          :class="localUnderstood ? 'btn-success text-white' : 'btn-outline btn-warning'"
          :disabled="isTogglingUnderstood"
          @click="toggleUnderstood"
        >
          <span v-if="isTogglingUnderstood" class="loading loading-spinner loading-xs" />
          <template v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path v-if="localUnderstood" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ localUnderstood ? $t("student.problems.understood") : $t("student.problems.mark_as_understood") }}
          </template>
        </button>
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
