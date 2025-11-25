<script setup lang="ts">
definePageMeta({
  layout: "student",
});

const { data: problems } = await useFetch("/api/problems");
</script>

<template>
  <div class="container mx-auto max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">Practice Problems</h1>

    <div v-if="problems" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="problem in problems"
        :key="problem.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
      >
        <div class="card-body">
          <h2 class="card-title text-lg">{{ problem.title }}</h2>
          <div class="flex gap-2 mt-2">
            <div
              class="badge"
              :class="{
                'badge-success': problem.difficulty === 'Easy',
                'badge-warning': problem.difficulty === 'Medium',
                'badge-error': problem.difficulty === 'Hard',
              }"
            >
              {{ problem.difficulty }}
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
              :to="`/student/problems/${problem.id}`"
              class="btn btn-primary btn-sm"
            >
              Solve
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  </div>
</template>
