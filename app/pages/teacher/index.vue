<script setup lang="ts">
definePageMeta({
  layout: "teacher",
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

const deleteProblem = async (id: string) => {
  if (!confirm("Are you sure you want to delete this problem?")) return;

  try {
    await $fetch(`/api/teacher/problems/${id}`, {
      method: "DELETE",
    });
    refresh();
  } catch (error) {
    console.error("Failed to delete problem:", error);
    alert("Failed to delete problem");
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Teacher Dashboard</h1>
      <NuxtLink to="/teacher/problems/create" class="btn btn-primary">
        Create New Problem
      </NuxtLink>
    </div>

    <ProblemSearch @search="handleSearch" />

    <div v-if="problems" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              :to="`/teacher/problems/${problem.id}/edit`"
              class="btn btn-warning btn-sm"
            >
              Edit
            </NuxtLink>
            <button
              @click="deleteProblem(problem.id)"
              class="btn btn-error btn-sm"
            >
              Delete
            </button>
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
      No problems found matching your criteria.
    </div>
  </div>
</template>
