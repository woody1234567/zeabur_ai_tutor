<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
const localePath = useLocalePath();

// --- Tab state ---
const activeTab = ref<"public" | "mine">("public");

interface TestbankItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

const selectedTestbank = ref<{ id: string; name: string } | null>(null);

// --- Dialog state ---
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showShareDialog = ref(false);
const editingTestbank = ref<TestbankItem | undefined>(undefined);
const sharingTestbank = ref<{ id: string; name: string }>({ id: "", name: "" });

// --- Search ---
const searchParams = ref({
  title: "",
  subject: "",
  chapter: "",
  grade: "",
  difficulty: "",
  source: "",
  hashtag: "",
});

// --- Problems query ---
const queryParams = computed(() => {
  const params: Record<string, any> = { ...searchParams.value };
  if (activeTab.value === "public") {
    params.tab = "public";
  } else if (selectedTestbank.value) {
    params.testbankId = selectedTestbank.value.id;
  }
  return params;
});

const shouldFetchProblems = computed(
  () => activeTab.value === "public" || selectedTestbank.value !== null
);

const { data: result, refresh } = await useFetch("/api/problems", {
  query: queryParams,
  watch: false,
  immediate: false,
});

watch([queryParams, shouldFetchProblems], () => {
  if (shouldFetchProblems.value) refresh();
}, { immediate: true });
const problems = computed(() => (shouldFetchProblems.value ? (result.value?.data ?? []) : []));

// --- Testbanks ---
const {
  data: testbanks,
  refresh: refreshTestbanks,
} = await useFetch<TestbankItem[]>("/api/teacher/testbanks");

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

// --- Problem actions ---
const deleteProblem = async (id: string) => {
  if (!confirm(useNuxtApp().$i18n.t("teacher.problems.confirm_delete"))) return;

  try {
    await $fetch(`/api/teacher/problems/${id}`, {
      method: "DELETE",
    });
    refresh();
  } catch (error) {
    console.error("Failed to delete problem:", error);
    alert(useNuxtApp().$i18n.t("teacher.problems.delete_error"));
  }
};

// --- Testbank actions ---
const selectTestbank = (testbank: TestbankItem) => {
  selectedTestbank.value = { id: testbank.id, name: testbank.name };
};

const goBackToTestbanks = () => {
  selectedTestbank.value = null;
};

const openCreateDialog = () => {
  editingTestbank.value = undefined;
  showCreateDialog.value = true;
};

const openEditDialog = (testbank: TestbankItem) => {
  editingTestbank.value = testbank;
  showEditDialog.value = true;
};

const openShareDialog = (testbank: TestbankItem) => {
  sharingTestbank.value = { id: testbank.id, name: testbank.name };
  showShareDialog.value = true;
};

const deleteTestbank = async (testbank: TestbankItem) => {
  if (!confirm(useNuxtApp().$i18n.t("teacher.problems.testbanks.confirm_delete"))) return;

  try {
    await $fetch(`/api/teacher/testbanks/${testbank.id}`, {
      method: "DELETE",
    });
    refreshTestbanks();
  } catch (error) {
    console.error("Failed to delete testbank:", error);
    alert(useNuxtApp().$i18n.t("teacher.problems.testbanks.delete_error"));
  }
};

const onTestbankSaved = () => {
  refreshTestbanks();
};
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-64px)]">
    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <div class="container mx-auto max-w-7xl">
        <div
          class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <h1 class="text-3xl font-bold">
            {{ $t("teacher.problems.page_title") }}
          </h1>
          <div class="flex gap-2 w-full md:w-auto">
            <NuxtLink
              :to="localePath('/teacher/homeworks/create')"
              class="btn btn-secondary flex-1 md:flex-none"
            >
              {{ $t("teacher.problems.create_hw") }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/teacher/problems/create')"
              class="btn btn-primary flex-1 md:flex-none"
            >
              {{ $t("teacher.problems.create_new") }}
            </NuxtLink>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs tabs-boxed mb-6">
          <a
            class="tab"
            :class="{ 'tab-active': activeTab === 'public' }"
            @click="activeTab = 'public'; selectedTestbank = null"
          >
            {{ $t("teacher.problems.tabs.public") }}
          </a>
          <a
            class="tab"
            :class="{ 'tab-active': activeTab === 'mine' }"
            @click="activeTab = 'mine'; selectedTestbank = null"
          >
            {{ $t("teacher.problems.tabs.mine") }}
          </a>
        </div>

        <!-- PUBLIC TAB: Problems list -->
        <template v-if="activeTab === 'public'">
          <ProblemSearch @search="handleSearch" />
          <br />

          <div v-if="result && result.total > 0" class="text-sm text-base-content/60 mb-4">
            {{ $t("components.common.search.showing_results", {
              from: ((result.page - 1) * result.pageSize) + 1,
              to: Math.min(result.page * result.pageSize, result.total),
              total: result.total,
            }) }}
          </div>

          <div v-if="problems.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TeacherProblemListCard
              v-for="problem in problems"
              :key="problem.id"
              :problem="problem"
              @delete="deleteProblem"
            />
          </div>

          <div v-if="!result" class="text-center py-10">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div
            v-if="result && problems.length === 0"
            class="text-center py-10 text-base-content/70"
          >
            {{ $t("teacher.problems.no_problems_found") }}
          </div>
        </template>

        <!-- MINE TAB: Testbank cards or testbank problems -->
        <template v-if="activeTab === 'mine'">
          <!-- Testbank problems view (a testbank is selected) -->
          <template v-if="selectedTestbank">
            <button class="btn btn-ghost mb-4" @click="goBackToTestbanks">
              &larr; {{ $t("teacher.problems.testbanks.back") }}
            </button>

            <h2 class="text-xl font-semibold mb-4">{{ selectedTestbank.name }}</h2>

            <ProblemSearch @search="handleSearch" />
            <br />

            <div v-if="result && result.total > 0" class="text-sm text-base-content/60 mb-4">
              {{ $t("components.common.search.showing_results", {
                from: ((result.page - 1) * result.pageSize) + 1,
                to: Math.min(result.page * result.pageSize, result.total),
                total: result.total,
              }) }}
            </div>

            <div v-if="problems.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <TeacherProblemListCard
                v-for="problem in problems"
                :key="problem.id"
                :problem="problem"
                @delete="deleteProblem"
              />
            </div>

            <div v-if="!result" class="text-center py-10">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div
              v-if="result && problems.length === 0"
              class="text-center py-10 text-base-content/70"
            >
              {{ $t("teacher.problems.no_problems_found") }}
            </div>
          </template>

          <!-- Testbank cards view (no testbank selected) -->
          <template v-else>
            <div class="flex justify-end mb-4">
              <button class="btn btn-primary" @click="openCreateDialog">
                {{ $t("teacher.problems.testbanks.create") }}
              </button>
            </div>

            <div
              v-if="testbanks && testbanks.length > 0"
              class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <TeacherTestbankCard
                v-for="tb in testbanks"
                :key="tb.id"
                :testbank="tb"
                @click="selectTestbank"
                @edit="openEditDialog"
                @delete="deleteTestbank"
                @share="openShareDialog"
              />
            </div>

            <div
              v-else-if="testbanks"
              class="text-center py-10 text-base-content/70"
            >
              {{ $t("teacher.problems.testbanks.no_testbanks") }}
            </div>

            <div v-else class="text-center py-10">
              <span class="loading loading-spinner loading-lg"></span>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- Dialogs -->
    <TeacherTestbankFormDialog
      v-model="showCreateDialog"
      @saved="onTestbankSaved"
    />

    <TeacherTestbankFormDialog
      v-model="showEditDialog"
      :testbank="editingTestbank"
      @saved="onTestbankSaved"
    />

    <TeacherTestbankShareDialog
      v-if="sharingTestbank.id"
      v-model="showShareDialog"
      :testbank-id="sharingTestbank.id"
      :testbank-name="sharingTestbank.name"
      @saved="onTestbankSaved"
    />
  </div>
</template>
