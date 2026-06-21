<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();

const searchParams = ref({
  title: "",
  subject: "",
  chapter: "",
  grade: "",
  difficulty: "",
  source: "",
  hashtag: "",
});

const { data: problems, refresh } = await useFetch("/api/problems", {
  query: searchParams,
});

const handleSearch = (params: {
  title: string;
  subject: string;
  chapter: string;
  grade: string;
  difficulty: string;
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
    <br />
    <div
      v-if="problems"
      class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <StudentProblemSummaryCard
        v-for="problem in problems"
        :key="problem.id"
        :problem="problem"
      />
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
