<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();
const { t } = useI18n();

const searchParams = ref({
  title: "",
  source: "",
  hashtag: "",
});

const { data: problems, refresh } = await useFetch(
  "/api/student/error-problems",
  {
    query: searchParams,
  }
);

const handleSearch = (params: {
  title: string;
  source: string;
  hashtag: string;
}) => {
  searchParams.value = params;
  refresh();
};

const loadingId = ref<string | null>(null);

const toggleFavorite = async (problem: any) => {
  if (loadingId.value) return;
  loadingId.value = problem.id;
  try {
    if (problem.isFavorite) {
      await $fetch("/api/favorite", {
        method: "DELETE",
        body: { problemId: problem.id },
      });
      problem.isFavorite = false;
    } else {
      await $fetch("/api/favorite", {
        method: "POST",
        body: { problemId: problem.id },
      });
      problem.isFavorite = true;
    }
  } catch (error) {
    console.error("Failed to toggle favorite", error);
  } finally {
    loadingId.value = null;
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <h1 class="text-3xl font-bold mb-8">
      {{ $t("student.error_problems.title", "Error Log") }}
    </h1>

    <ProblemSearch @search="handleSearch" />
    <br />
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
          <div class="card-actions justify-between mt-4 items-center gap-2">
            <div>
              <Icon
                name="heroicons:x-mark-20-solid"
                class="w-6 h-6 text-red-500 font-bold"
                title="Incorrectly answered"
              />
            </div>
            <div class="flex gap-2 items-center">
              <button
                class="btn btn-ghost btn-circle btn-sm"
                @click="toggleFavorite(problem)"
                :disabled="loadingId === problem.id"
              >
                <span
                  v-if="loadingId === problem.id"
                  class="loading loading-spinner loading-xs"
                ></span>
                <Icon
                  v-else
                  :name="
                    problem.isFavorite
                      ? 'heroicons:heart-solid'
                      : 'heroicons:heart'
                  "
                  class="w-5 h-5"
                  :class="{ 'text-red-500': problem.isFavorite }"
                />
              </button>
              <NuxtLink
                :to="localePath(`/student/problems/${problem.id}`)"
                class="btn btn-ghost btn-sm"
              >
                {{ $t("student.problems.solve") }}
              </NuxtLink>
            </div>
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
