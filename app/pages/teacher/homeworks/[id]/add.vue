<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const localePath = useLocalePath();
const route = useRoute();
const homeworkId = route.params.id as string;
const router = useRouter();

// Fetch Homework Details (to know what's already assigned)
const { data: homeworkData, refresh: refreshHomework } = await useFetch(
  `/api/teacher/homeworks/${homeworkId}`
);

// Search State
const searchParams = ref({
  title: "",
  source: "",
  hashtag: "",
});

// Fetch All Problems
const { data: allProblems, refresh: refreshProblems } = await useFetch(
  "/api/problems",
  {
    query: searchParams,
  }
);

// Staging State
const stagedProblems = ref<any[]>([]);
const isSaving = ref(false);

// Computed: Set of IDs already in homework
const existingProblemIds = computed(() => {
  if (!homeworkData.value || !homeworkData.value.problems) return new Set();
  return new Set(homeworkData.value.problems.map((p: any) => p.id));
});

// Computed: Set of IDs in staging
const stagedProblemIds = computed(() => {
  return new Set(stagedProblems.value.map((p) => p.id));
});

const handleSearch = (params: {
  title: string;
  source: string;
  hashtag: string;
}) => {
  searchParams.value = params;
  refreshProblems();
};

const addToStage = (problem: any) => {
  if (
    !existingProblemIds.value.has(problem.id) &&
    !stagedProblemIds.value.has(problem.id)
  ) {
    stagedProblems.value.push(problem);
  }
};

const removeFromStage = (problemId: string) => {
  stagedProblems.value = stagedProblems.value.filter((p) => p.id !== problemId);
};

const saveChanges = async () => {
  if (stagedProblems.value.length === 0) return;

  isSaving.value = true;
  try {
    await $fetch(`/api/teacher/homeworks/${homeworkId}/problems`, {
      method: "POST",
      body: {
        problemIds: stagedProblems.value.map((p) => p.id),
      },
    });
    // Navigate back to homework details
    router.push(localePath(`/teacher/homeworks/${homeworkId}`));
  } catch (error) {
    console.error("Failed to add problems:", error);
    alert("Failed to add problems to homework");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <!-- Left Column: Search & Browse -->
    <div class="flex-1 flex flex-col border-r border-base-300 min-w-0">
      <div class="p-4 border-b border-base-300 bg-base-100 z-10">
        <div class="flex items-center gap-4 mb-4">
          <NuxtLink
            :to="localePath(`/teacher/homeworks/${homeworkId}`)"
            class="btn btn-ghost btn-sm gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
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
            {{ $t("teacher.homeworks.add.back") }}
          </NuxtLink>
          <h1 class="text-2xl font-bold">
            {{ $t("teacher.homeworks.add.problems") }}
          </h1>
        </div>
        <ProblemSearch @search="handleSearch" />
      </div>

      <div class="flex-1 overflow-y-auto p-4 bg-base-200/50">
        <div
          v-if="allProblems"
          class="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="problem in allProblems"
            :key="problem.id"
            class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="card-body p-4">
              <h3 class="card-title text-base">{{ problem.title }}</h3>
              <div class="flex gap-1 flex-wrap mt-2">
                <span
                  class="badge badge-xs"
                  :class="{
                    'badge-success': problem.difficulty === 'easy',
                    'badge-warning': problem.difficulty === 'medium',
                    'badge-error': problem.difficulty === 'hard',
                  }"
                  >{{ problem.difficulty }}</span
                >
                <span
                  v-if="problem.source"
                  class="badge badge-ghost badge-xs"
                  >{{ problem.source }}</span
                >
                <span
                  v-for="tag in problem.hashtags"
                  :key="tag"
                  class="badge badge-secondary badge-outline badge-xs"
                  >#{{ tag }}</span
                >
              </div>
              <div class="card-actions justify-end mt-4">
                <button
                  v-if="existingProblemIds.has(problem.id)"
                  class="btn btn-sm btn-disabled"
                >
                  {{ $t("teacher.homeworks.add.assigned") }}
                </button>
                <button
                  v-else-if="stagedProblemIds.has(problem.id)"
                  class="btn btn-sm btn-success text-white"
                  disabled
                >
                  {{ $t("teacher.homeworks.add.selected") }}
                </button>
                <button
                  v-else
                  @click="addToStage(problem)"
                  class="btn btn-sm btn-primary"
                >
                  {{ $t("teacher.homeworks.add.add_to_hw") }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex justify-center p-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    </div>

    <!-- Right Column: Staging Area -->
    <div class="w-96 flex flex-col bg-base-100 shadow-xl z-20">
      <div class="p-4 border-b border-base-300">
        <h2 class="text-xl font-bold flex justify-between items-center">
          {{ $t("teacher.homeworks.add.selected_problems") }}
          <span class="badge badge-primary">{{ stagedProblems.length }}</span>
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div
          v-if="stagedProblems.length === 0"
          class="text-center py-10 opacity-50"
        >
          <p>{{ $t("teacher.homeworks.add.no_problems_selected") }}</p>
          <p class="text-sm">
            {{ $t("teacher.homeworks.add.no_problems_selected_description") }}
          </p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(problem, index) in stagedProblems"
            :key="problem.id"
            class="card bg-base-200 border border-base-300 compact"
          >
            <div class="card-body flex-row items-center justify-between p-3">
              <div class="flex-1 min-w-0 mr-2">
                <div class="font-medium truncate">{{ problem.title }}</div>
                <div class="text-xs opacity-70">{{ problem.difficulty }}</div>
              </div>
              <button
                @click="removeFromStage(problem.id)"
                class="btn btn-ghost btn-xs text-error btn-square"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-base-300 bg-base-100">
        <button
          @click="saveChanges"
          class="btn btn-primary w-full"
          :disabled="stagedProblems.length === 0 || isSaving"
        >
          <span v-if="isSaving" class="loading loading-spinner"></span>
          {{
            isSaving
              ? $t("teacher.homeworks.add.adding")
              : $t("teacher.homeworks.add.add_to_hw")
          }}
        </button>
      </div>
    </div>
  </div>
</template>
