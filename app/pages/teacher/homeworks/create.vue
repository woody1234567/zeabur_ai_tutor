<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
const localePath = useLocalePath();

const searchParams = ref({
  title: "",
  source: "",
  hashtag: "",
});

const { data: problems, refresh } = await useFetch("/api/problems", {
  query: searchParams,
});

const { data: classrooms } = await useFetch("/api/teacher/classrooms");

const handleSearch = (params: {
  title: string;
  source: string;
  hashtag: string;
}) => {
  searchParams.value = params;
  refresh();
};

// Homework Creation Logic
const hwForm = ref({
  classroomId: "",
  subject: "",
  title: "",
  deadline: "",
});
const selectedProblems = ref<any[]>([]);

const addToHw = (problem: any) => {
  if (!selectedProblems.value.find((p) => p.id === problem.id)) {
    selectedProblems.value.push(problem);
  }
};

const removeFromHw = (problemId: string) => {
  selectedProblems.value = selectedProblems.value.filter(
    (p) => p.id !== problemId
  );
};

const createHomework = async () => {
  if (!hwForm.value.classroomId) {
    alert(
      useNuxtApp().$i18n.t("teacher.homeworks.create.alert_select_classroom")
    );
    return;
  }
  if (selectedProblems.value.length === 0) {
    alert(
      useNuxtApp().$i18n.t("teacher.homeworks.create.alert_select_problem")
    );
    return;
  }

  try {
    await $fetch("/api/teacher/homeworks", {
      method: "POST",
      body: {
        classroomIds: [hwForm.value.classroomId],
        subject: hwForm.value.subject,
        title: hwForm.value.title,
        deadline: hwForm.value.deadline,
        problemIds: selectedProblems.value.map((p) => p.id),
      },
    });
    alert(useNuxtApp().$i18n.t("teacher.homeworks.create.success_message"));
    // Redirect to homework list
    navigateTo(localePath("/teacher/homeworks"));
  } catch (error) {
    console.error("Failed to create homework:", error);
    alert(useNuxtApp().$i18n.t("teacher.homeworks.create.error_message"));
  }
};
</script>

<template>
  <div class="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
    <!-- Left Column: Problem Search & List -->
    <div class="flex-1 flex flex-col overflow-hidden border-r border-base-300">
      <div class="p-4 md:p-6 overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">
            {{ $t("teacher.homeworks.create.select_problems") }}
          </h1>
          <NuxtLink
            :to="localePath('/teacher/homeworks')"
            class="btn btn-ghost btn-sm"
          >
            {{ $t("teacher.homeworks.create.cancel") }}
          </NuxtLink>
        </div>

        <ProblemSearch @search="handleSearch" />

        <div
          v-if="problems"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6"
        >
          <div
            v-for="problem in problems"
            :key="problem.id"
            class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border border-base-200"
          >
            <div class="card-body p-4">
              <h2 class="card-title text-base">{{ problem.title }}</h2>
              <div class="flex gap-1 mt-1 flex-wrap">
                <div
                  class="badge badge-sm"
                  :class="{
                    'badge-success': problem.difficulty === 'easy',
                    'badge-warning': problem.difficulty === 'medium',
                    'badge-error': problem.difficulty === 'hard',
                  }"
                >
                  {{ problem.difficulty }}
                </div>
                <div v-if="problem.source" class="badge badge-ghost badge-sm">
                  {{ problem.source }}
                </div>
              </div>
              <div class="card-actions justify-end mt-3">
                <button
                  @click="addToHw(problem)"
                  class="btn btn-primary btn-sm btn-outline"
                  :disabled="
                    !!selectedProblems.find((p) => p.id === problem.id)
                  "
                >
                  {{
                    selectedProblems.find((p) => p.id === problem.id)
                      ? $t("teacher.homeworks.create.added")
                      : $t("teacher.homeworks.create.add")
                  }}
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
          {{ $t("teacher.homeworks.create.no_problems_found") }}
        </div>
      </div>
    </div>

    <!-- Right Column: Homework Form -->
    <div
      class="w-full md:w-96 bg-base-200 flex flex-col h-full overflow-hidden shadow-xl z-10"
    >
      <div class="p-4 bg-base-200 border-b border-base-300">
        <h2 class="text-xl font-bold">
          {{ $t("teacher.homeworks.create.title") }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">{{
              $t("teacher.homeworks.create.classroom_label")
            }}</span>
          </label>
          <select
            v-model="hwForm.classroomId"
            class="select select-bordered w-full bg-base-100"
          >
            <option disabled value="">
              {{ $t("teacher.homeworks.create.select_classroom_placeholder") }}
            </option>
            <option
              v-for="classroom in classrooms"
              :key="classroom.id"
              :value="classroom.id"
            >
              {{ classroom.name }}
            </option>
          </select>
        </div>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">{{
              $t("teacher.homeworks.create.subject_label")
            }}</span>
          </label>
          <input
            v-model="hwForm.subject"
            type="text"
            :placeholder="$t('teacher.homeworks.create.subject_placeholder')"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">{{
              $t("teacher.homeworks.create.title_label")
            }}</span>
          </label>
          <input
            v-model="hwForm.title"
            type="text"
            :placeholder="$t('teacher.homeworks.create.title_placeholder')"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">{{
              $t("teacher.homeworks.create.deadline_label")
            }}</span>
          </label>
          <input
            v-model="hwForm.deadline"
            type="datetime-local"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="divider">
          {{ $t("teacher.homeworks.create.selected_problems") }} ({{
            selectedProblems.length
          }})
        </div>

        <div class="flex flex-col gap-2 mb-4">
          <div
            v-for="(problem, index) in selectedProblems"
            :key="problem.id"
            class="flex justify-between items-center bg-base-100 p-3 rounded shadow-sm border border-base-300"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="font-bold text-sm">{{ index + 1 }}.</span>
              <span class="truncate text-sm">{{ problem.title }}</span>
            </div>
            <button
              @click="removeFromHw(problem.id)"
              class="btn btn-ghost btn-xs text-error btn-square"
            >
              <Icon name="heroicons-outline:x" class="h-4 w-4" />
            </button>
          </div>

          <div
            v-if="selectedProblems.length === 0"
            class="text-center text-sm opacity-70 py-8 border-2 border-dashed border-base-300 rounded-lg"
          >
            {{ $t("teacher.homeworks.create.no_problems_selected") }} <br />
            <span class="text-xs">{{
              $t("teacher.homeworks.create.add_instruction")
            }}</span>
          </div>
        </div>
      </div>

      <div class="p-4 bg-base-200 border-t border-base-300">
        <button
          @click="createHomework"
          class="btn btn-primary w-full"
          :disabled="!hwForm.classroomId || selectedProblems.length === 0"
        >
          {{ $t("teacher.homeworks.create.title") }}
        </button>
      </div>
    </div>
  </div>
</template>
