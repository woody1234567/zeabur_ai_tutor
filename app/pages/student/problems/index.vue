<script setup lang="ts">
definePageMeta({
  layout: "student",
});

const searchParams = ref({
  title: "",
  source: "",
  hashtag: "",
});

const { data: problems, refresh } = await useFetch("/api/problems", {
  query: searchParams,
});

const handleSearch = (params: {
  title: string;
  source: string;
  hashtag: string;
}) => {
  searchParams.value = params;
  refresh();
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <h1 class="text-3xl font-bold mb-8">{{ $t("student.problems.title") }}</h1>

    <ProblemSearch @search="handleSearch" />

    <div
      v-if="problems"
      class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="problem in problems"
        :key="problem.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
      >
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
              {{ $t("student.problems.solve") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-if="problems && problems.length === 0"
      class="text-center py-10 text-base-content/70"
    >
      {{ $t("student.problems.no_problems") }}
    </div>
  </div>
</template>
