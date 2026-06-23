<script setup lang="ts">
interface Problem {
  id: string;
  title: string;
  difficulty: string;
  subject?: string | null;
  chapter?: string | null;
  grade?: string | null;
  source?: string | null;
  hashtags?: string[] | null;
}

defineProps<{
  problem: Problem;
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
}>();

const localePath = useLocalePath();
</script>

<template>
  <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
    <div class="card-body">
      <h2 class="card-title text-lg">{{ problem.title }}</h2>
      <div class="flex gap-2 mt-2 flex-wrap">
        <div
          class="badge"
          :class="{
            'badge-success': problem.difficulty === 'easy',
            'badge-warning': problem.difficulty === 'medium',
            'badge-error': problem.difficulty === 'hard',
          }"
        >
          {{ problem.difficulty }}
        </div>
        <div v-if="problem.subject" class="badge badge-info badge-outline">
          {{ problem.subject }}
        </div>
        <div v-if="problem.chapter" class="badge badge-ghost">
          {{ problem.chapter }}
        </div>
        <div v-if="problem.grade" class="badge badge-ghost badge-outline">
          {{ problem.grade }}
        </div>
        <div v-if="problem.source" class="badge badge-ghost">
          {{ problem.source }}
        </div>
        <div
          v-for="tag in problem.hashtags"
          :key="tag"
          class="badge badge-secondary badge-outline"
        >
          #{{ tag }}
        </div>
      </div>
      <div class="card-actions justify-end mt-4">
        <NuxtLink
          :to="localePath(`/teacher/problems/${problem.id}/edit`)"
          class="btn btn-warning btn-sm"
        >
          {{ $t("teacher.problems.edit_button") }}
        </NuxtLink>
        <button
          @click="emit('delete', problem.id)"
          class="btn btn-error btn-sm"
        >
          {{ $t("teacher.problems.delete") }}
        </button>
      </div>
    </div>
  </div>
</template>
