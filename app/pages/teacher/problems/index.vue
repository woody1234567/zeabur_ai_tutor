<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const { data: problems, refresh } = await useFetch("/api/problems");

const deleteProblem = async (id: string) => {
  if (!confirm("Are you sure you want to delete this problem?")) return;

  try {
    await $fetch(`/api/teacher/problems/${id}`, {
      method: "DELETE",
    });
    await refresh(); // Refresh the list
    alert("Problem deleted successfully");
  } catch (error: any) {
    console.error("Error deleting problem:", error);
    alert(`Failed to delete problem: ${error.message || "Unknown error"}`);
  }
};
</script>

<template>
  <div class="container mx-auto max-w-4xl p-4">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Manage Problems</h1>
      <NuxtLink to="/teacher/problems/create" class="btn btn-primary">
        + Create Problem
      </NuxtLink>
    </div>

    <div v-if="problems" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="problem in problems"
        :key="problem.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
      >
        <div class="card-body">
          <h2 class="card-title text-lg justify-between">
            {{ problem.title }}
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
            <div
              v-for="tag in problem.hashtags"
              :key="tag"
              class="badge badge-secondary badge-outline"
            >
              #{{ tag }}
            </div>
          </h2>

          <div v-if="problem.source" class="text-sm text-gray-500 mb-4">
            Source: {{ problem.source }}
          </div>

          <div class="card-actions justify-end mt-auto">
            <button
              @click="deleteProblem(problem.id)"
              class="btn btn-error btn-sm btn-outline"
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
      class="text-center py-10 text-gray-500"
    >
      No problems found. Create one to get started!
    </div>
  </div>
</template>
