<script setup lang="ts">
definePageMeta({
  layout: "parent",
});
const localePath = useLocalePath();

const route = useRoute();
const studentId = route.params.id as string;
const classroomId = route.params.classroomId as string;

const {
  data: performance,
  pending,
  error,
} = await useFetch(
  `/api/parent/students/${studentId}/classrooms/${classroomId}/performance`
);

const { data: posts } = await useFetch(
  `/api/teacher/classrooms/${classroomId}/posts`
);
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="mb-4">
      <NuxtLink
        :to="localePath(`/parent/student_info/${studentId}`)"
        class="btn btn-ghost btn-sm gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
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
        {{ $t("parent.student_info.back_to_student_classrooms") }}
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span
        >{{ $t("parent.student_info.error_loading_performance") }}
        {{ error.message }}</span
      >
    </div>

    <div v-else-if="performance">
      <StudentClassroomPerformance :performance="performance" />

      <!-- Contact Book Section -->
      <div class="card bg-base-100 shadow-xl border border-base-200 mt-8">
        <div class="card-body">
          <h2 class="card-title mb-4">
            {{ $t("teacher.classrooms.posts.title", "Contact Book") }}
          </h2>

          <div v-if="posts && posts.length > 0" class="space-y-4">
            <PostsCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :students="[performance.student]"
            />
          </div>
          <div v-else class="text-center py-10 opacity-50">
            <p>
              {{ $t("teacher.classrooms.posts.no_posts", "No posts yet") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
