<script setup lang="ts">
import MarkdownRenderer from "~/components/MarkdownRenderer.vue";

definePageMeta({
  layout: "teacher",
});

const route = useRoute();
const homeworkId = route.params.id as string;

interface HomeworkDetails {
  homework: {
    id: string;
    title: string | null;
    subject: string | null;
    deadline: string | null;
    createdAt: string;
    classroomName: string | null;
    classroomId: string | null;
  };
  problems: {
    id: string;
    title: string;
    difficulty: string | null;
    content: string;
    order: string | null;
  }[];
}

const { data, pending, error } = await useFetch<HomeworkDetails>(
  `/api/teacher/homeworks/${homeworkId}`
);

const formatDate = (dateString: string | null) => {
  if (!dateString) return "No deadline";
  return (
    new Date(dateString).toLocaleDateString() +
    " " +
    new Date(dateString).toLocaleTimeString()
  );
};
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="mb-6">
      <NuxtLink to="/teacher/homeworks" class="btn btn-ghost gap-2 pl-0">
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Homeworks
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>Error loading homework details: {{ error.message }}</span>
    </div>

    <div v-else-if="data" class="space-y-8">
      <!-- Homework Header -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold text-primary mb-2">
                {{ data.homework.title }}
              </h1>
              <div class="badge badge-secondary text-lg p-3">
                {{ data.homework.subject }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">Classroom</div>
              <div class="font-semibold text-lg">
                {{ data.homework.classroomName }}
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="font-semibold">Deadline:</span>
              <span
                :class="{
                  'text-error':
                    data.homework.deadline &&
                    new Date(data.homework.deadline) < new Date(),
                }"
              >
                {{ formatDate(data.homework.deadline) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="font-semibold">Created:</span>
              <span>{{
                new Date(data.homework.createdAt).toLocaleDateString()
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Problems List -->
      <div>
        <h2 class="text-2xl font-bold mb-4">
          Assigned Problems ({{ data.problems.length }})
        </h2>

        <div v-if="data.problems.length === 0" class="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No problems assigned to this homework.</span>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(problem, index) in data.problems"
            :key="problem.id"
            class="collapse collapse-arrow bg-base-100 shadow-md"
          >
            <input type="checkbox" />
            <div
              class="collapse-title text-xl font-medium flex items-center gap-4"
            >
              <span class="badge badge-primary badge-lg">{{ index + 1 }}</span>
              <span>{{ problem.title }}</span>
              <span class="badge badge-ghost ml-auto">{{
                problem.difficulty
              }}</span>
            </div>
            <div class="collapse-content">
              <div class="prose max-w-none pt-4">
                <MarkdownRenderer :content="problem.content" />
              </div>
              <div class="mt-4 flex justify-end">
                <NuxtLink
                  :to="`/teacher/problems/${problem.id}/edit`"
                  class="btn btn-sm btn-outline btn-primary"
                >
                  Edit Problem
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
