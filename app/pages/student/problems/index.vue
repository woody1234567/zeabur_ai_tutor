<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();
const route = useRoute();

const testbankId = computed(() => route.query.testbankId as string | undefined);
const testbankName = computed(() => route.query.name as string | undefined);

const currentPage = ref(1);
const pageSize = ref(12);

const searchParams = ref({
  title: "",
  subject: "",
  chapter: "",
  grade: "",
  difficulty: "",
  source: "",
  hashtag: "",
});

const queryParams = computed(() => ({
  ...searchParams.value,
  ...(testbankId.value ? { testbankId: testbankId.value } : {}),
  page: currentPage.value,
  pageSize: pageSize.value,
}));

const { data: result, refresh } = await useFetch("/api/problems", {
  query: queryParams,
});

const problems = computed(() => result.value?.data ?? []);
const totalPages = computed(() => result.value?.totalPages ?? 1);
const total = computed(() => result.value?.total ?? 0);

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
  currentPage.value = 1;
};

watch([pageSize, testbankId], () => {
  currentPage.value = 1;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const visiblePages = computed(() => {
  const pages: number[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 3) pages.push(-1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push(-1);
  pages.push(total);

  return pages;
});
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <div v-if="testbankId" class="mb-4">
      <NuxtLink
        :to="localePath('/student/testbanks')"
        class="btn btn-ghost btn-sm gap-2"
      >
        <Icon name="heroicons-solid:arrow-sm-left" />
        {{ $t("student.testbanks.back") }}
      </NuxtLink>
    </div>

    <h1 class="text-3xl font-bold mb-8">
      {{ testbankId ? testbankName || $t("student.testbanks.title") : $t("student.problems.title") }}
    </h1>

    <ProblemSearch v-model:page-size="pageSize" @search="handleSearch" />
    <br />

    <div v-if="total > 0" class="text-sm text-base-content/60 mb-4">
      {{ $t("components.common.search.showing_results", {
        from: (currentPage - 1) * pageSize + 1,
        to: Math.min(currentPage * pageSize, total),
        total,
      }) }}
    </div>

    <div
      v-if="problems.length > 0"
      class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <StudentProblemSummaryCard
        v-for="problem in problems"
        :key="problem.id"
        :problem="problem"
      />
    </div>

    <div v-if="!result" class="text-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-if="result && problems.length === 0"
      class="text-center py-10 text-base-content/70"
    >
      {{ $t("student.problems.no_problems") }}
    </div>

    <div v-if="totalPages > 1" class="flex justify-center mt-8">
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          «
        </button>
        <template v-for="(page, idx) in visiblePages" :key="idx">
          <button
            v-if="page === -1"
            class="join-item btn btn-sm btn-disabled"
          >
            …
          </button>
          <button
            v-else
            class="join-item btn btn-sm"
            :class="{ 'btn-active': page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>
