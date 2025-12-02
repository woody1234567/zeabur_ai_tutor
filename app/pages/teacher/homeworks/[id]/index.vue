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

const { data, pending, error, refresh } = await useFetch<HomeworkDetails>(
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

// Settings Sidebar Logic
const isSettingsOpen = ref(false);
const settingsForm = ref({
  title: "",
  subject: "",
  deadline: "",
  classroomId: "",
});
const isUpdatingSettings = ref(false);
const settingsError = ref("");

// Fetch classrooms for dropdown
const { data: classrooms } = await useFetch("/api/teacher/classrooms");

const openSettings = () => {
  if (data.value && data.value.homework) {
    settingsForm.value.title = data.value.homework.title || "";
    settingsForm.value.subject = data.value.homework.subject || "";
    settingsForm.value.classroomId = data.value.homework.classroomId || "";
    // Format deadline for datetime-local input (YYYY-MM-DDThh:mm)
    if (data.value.homework.deadline) {
      const date = new Date(data.value.homework.deadline);
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      settingsForm.value.deadline = localISOTime;
    } else {
      settingsForm.value.deadline = "";
    }
    isSettingsOpen.value = true;
  }
};

const updateHomework = async () => {
  if (!settingsForm.value.title || !settingsForm.value.classroomId) return;

  isUpdatingSettings.value = true;
  settingsError.value = "";

  try {
    await $fetch(`/api/teacher/homeworks/${homeworkId}`, {
      method: "PUT",
      body: settingsForm.value,
    });
    await refresh(); // Refresh homework data
    isSettingsOpen.value = false;
  } catch (e: any) {
    settingsError.value = e.message || "Failed to update homework";
  } finally {
    isUpdatingSettings.value = false;
  }
};
</script>

<template>
  <div class="drawer drawer-end">
    <input
      id="settings-drawer"
      type="checkbox"
      class="drawer-toggle"
      v-model="isSettingsOpen"
    />
    <div class="drawer-content">
      <div class="container mx-auto p-4 md:p-6">
        <div class="mb-6 flex justify-between items-center">
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
          <button
            v-if="data"
            @click="openSettings"
            class="btn btn-ghost btn-circle"
            title="Settings"
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
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
              <div
                class="flex flex-col md:flex-row justify-between items-start gap-4"
              >
                <div>
                  <h1 class="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {{ data.homework.title }}
                  </h1>
                  <div class="badge badge-secondary text-lg p-3">
                    {{ data.homework.subject }}
                  </div>
                </div>
                <div class="text-left md:text-right w-full md:w-auto">
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
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold">
                Assigned Problems ({{ data.problems.length }})
              </h2>
              <NuxtLink
                :to="`/teacher/homeworks/${homeworkId}/add`"
                class="btn btn-primary btn-sm gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Problems
              </NuxtLink>
            </div>

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
                  <span class="badge badge-primary badge-lg">{{
                    index + 1
                  }}</span>
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
    </div>
    <div class="drawer-side">
      <label
        for="settings-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
        <h2 class="text-2xl font-bold mb-6">Homework Settings</h2>

        <div v-if="settingsError" class="alert alert-error mb-4">
          <span>{{ settingsError }}</span>
        </div>

        <form @submit.prevent="updateHomework" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Title</span>
            </label>
            <input
              v-model="settingsForm.title"
              type="text"
              placeholder="Homework Title"
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Subject</span>
            </label>
            <input
              v-model="settingsForm.subject"
              type="text"
              placeholder="Subject"
              class="input input-bordered w-full"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Deadline</span>
            </label>
            <input
              v-model="settingsForm.deadline"
              type="datetime-local"
              class="input input-bordered w-full"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Classroom</span>
            </label>
            <select
              v-model="settingsForm.classroomId"
              class="select select-bordered w-full"
              required
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

          <div class="mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="isUpdatingSettings"
            >
              <span
                v-if="isUpdatingSettings"
                class="loading loading-spinner"
              ></span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
