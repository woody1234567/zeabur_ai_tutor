<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

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
    alert("Please select a classroom");
    return;
  }
  if (selectedProblems.value.length === 0) {
    alert("Please select at least one problem");
    return;
  }

  try {
    await $fetch("/api/teacher/homeworks", {
      method: "POST",
      body: {
        ...hwForm.value,
        problemIds: selectedProblems.value.map((p) => p.id),
      },
    });
    alert("Homework created successfully!");
    // Redirect to homework list
    navigateTo("/teacher/homeworks");
  } catch (error) {
    console.error("Failed to create homework:", error);
    alert("Failed to create homework");
  }
};
</script>

<template>
  <div class="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
    <!-- Left Column: Problem Search & List -->
    <div class="flex-1 flex flex-col overflow-hidden border-r border-base-300">
      <div class="p-4 md:p-6 overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">Select Problems</h1>
          <NuxtLink to="/teacher/homeworks" class="btn btn-ghost btn-sm">
            Cancel
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
                      ? "Added"
                      : "Add"
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
          No problems found matching your criteria.
        </div>
      </div>
    </div>

    <!-- Right Column: Homework Form -->
    <div
      class="w-full md:w-96 bg-base-200 flex flex-col h-full overflow-hidden shadow-xl z-10"
    >
      <div class="p-4 bg-base-200 border-b border-base-300">
        <h2 class="text-xl font-bold">Create Homework</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">Classroom</span>
          </label>
          <select
            v-model="hwForm.classroomId"
            class="select select-bordered w-full bg-base-100"
          >
            <option disabled value="">Select a classroom</option>
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
            <span class="label-text">Subject</span>
          </label>
          <input
            v-model="hwForm.subject"
            type="text"
            placeholder="e.g. Math"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">Title</span>
          </label>
          <input
            v-model="hwForm.title"
            type="text"
            placeholder="Homework Title"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">Deadline</span>
          </label>
          <input
            v-model="hwForm.deadline"
            type="datetime-local"
            class="input input-bordered w-full bg-base-100"
          />
        </div>

        <div class="divider">
          Selected Problems ({{ selectedProblems.length }})
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            v-if="selectedProblems.length === 0"
            class="text-center text-sm opacity-70 py-8 border-2 border-dashed border-base-300 rounded-lg"
          >
            No problems selected. <br />
            <span class="text-xs"
              >Click "Add" on the left to select problems.</span
            >
          </div>
        </div>
      </div>

      <div class="p-4 bg-base-200 border-t border-base-300">
        <button
          @click="createHomework"
          class="btn btn-primary w-full"
          :disabled="!hwForm.classroomId || selectedProblems.length === 0"
        >
          Create Homework
        </button>
      </div>
    </div>
  </div>
</template>
