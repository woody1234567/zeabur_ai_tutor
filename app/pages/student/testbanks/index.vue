<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();

interface StudentTestbank {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

const {
  data: testbanks,
  pending,
  error,
} = await useFetch<StudentTestbank[]>("/api/student/testbanks");
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <h1 class="text-3xl font-bold mb-8">
      {{ $t("student.testbanks.title") }}
    </h1>

    <div v-if="pending" class="text-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <div
      v-else-if="testbanks && testbanks.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="testbank in testbanks"
        :key="testbank.id"
        :to="
          localePath({
            path: '/student/problems',
            query: { testbankId: testbank.id, name: testbank.name },
          })
        "
        class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <h3 class="card-title text-base">{{ testbank.name }}</h3>
          <p
            v-if="testbank.description"
            class="text-sm text-base-content/70 line-clamp-2"
          >
            {{ testbank.description }}
          </p>
          <div class="mt-2">
            <div class="badge badge-ghost badge-outline">
              {{
                $t("teacher.problems.testbanks.problem_count", {
                  count: testbank.problemCount,
                })
              }}
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-10 text-base-content/70">
      {{ $t("student.testbanks.empty") }}
    </div>
  </div>
</template>
