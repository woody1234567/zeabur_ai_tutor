<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
const localePath = useLocalePath();

const route = useRoute();
const classroomId = route.params.id as string;

// Fetch classroom details
const {
  data: classroom,
  refresh,
  error,
} = await useFetch(`/api/teacher/classrooms/${classroomId}`);

// Fetch homeworks
const { data: homeworks } = await useFetch(
  `/api/teacher/classrooms/${classroomId}/homeworks`
);

// Fetch all students for the modal
const { data: allStudents } = await useFetch("/api/teacher/students");

const isAddingStudent = ref(false);
const selectedStudentId = ref("");
const isSubmitting = ref(false);

const addStudent = async () => {
  if (!selectedStudentId.value) return;

  isSubmitting.value = true;
  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}/students`, {
      method: "POST",
      body: { studentId: selectedStudentId.value },
    });
    await refresh();
    isAddingStudent.value = false;
    selectedStudentId.value = "";
  } catch (e) {
    console.error("Failed to add student", e);
  } finally {
    isSubmitting.value = false;
  }
};

const removeStudent = async (studentId: string) => {
  if (
    !confirm(useNuxtApp().$i18n.t("teacher.classrooms.confirm_remove_student"))
  )
    return;

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}/students`, {
      method: "DELETE",
      body: { studentId },
    });
    await refresh();
  } catch (e) {
    console.error("Failed to remove student", e);
  }
};

// Filter out students already in the class
const availableStudents = computed(() => {
  if (!allStudents.value || !classroom.value) return [];
  const enrolledIds = new Set(classroom.value.students.map((s: any) => s.id));
  return allStudents.value.filter((s: any) => !enrolledIds.has(s.id));
});

// Settings Sidebar Logic
const isSettingsOpen = ref(false);
const settingsForm = ref({
  name: "",
  description: "",
});
const isUpdatingSettings = ref(false);
const settingsError = ref("");

const openSettings = () => {
  if (classroom.value) {
    settingsForm.value.name = classroom.value.name;
    settingsForm.value.description = classroom.value.description || "";
    isSettingsOpen.value = true;
  }
};

const updateClassroom = async () => {
  if (!settingsForm.value.name) return;

  isUpdatingSettings.value = true;
  settingsError.value = "";

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}`, {
      method: "PUT",
      body: settingsForm.value,
    });
    await refresh();
    isSettingsOpen.value = false;
  } catch (e: any) {
    settingsError.value = e.message || "Failed to update classroom";
  } finally {
    isUpdatingSettings.value = false;
  }
};

const isDeleting = ref(false);

const deleteClassroom = async () => {
  if (
    !confirm(
      useNuxtApp().$i18n.t("teacher.classrooms.confirm_delete_classroom")
    )
  ) {
    return;
  }

  isDeleting.value = true;
  settingsError.value = "";

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}`, {
      method: "DELETE",
    });
    // Redirect to classrooms list
    await navigateTo(localePath("/teacher/classrooms"));
  } catch (e: any) {
    settingsError.value = e.message || "Failed to delete classroom";
    isDeleting.value = false;
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
        <div class="mb-4">
          <NuxtLink
            :to="localePath('/teacher/classrooms')"
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
            {{ $t("teacher.classrooms.back") }}
          </NuxtLink>
        </div>

        <div v-if="classroom" class="space-y-8">
          <!-- Header -->
          <div
            class="flex flex-col md:flex-row justify-between items-start gap-4"
          >
            <div>
              <h1 class="text-2xl md:text-3xl font-bold">
                {{ classroom.name }}
              </h1>
              <p class="text-base md:text-lg opacity-70 mt-2">
                {{ classroom.description }}
              </p>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
              <button
                class="btn btn-ghost btn-circle"
                :title="$t('teacher.classrooms.settings')"
                @click="openSettings"
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
          </div>

          <!-- Students List -->
          <div class="card bg-base-100 shadow-xl border border-base-200">
            <div class="card-body">
              <div class="flex w-full items-center justify-between">
                <h2 class="card-title mb-4">
                  {{ $t("teacher.classrooms.enrolled_students") }} ({{
                    classroom.students.length
                  }})
                </h2>
                <button
                  class="btn btn-primary justify-end mt-2 mr-2"
                  @click="isAddingStudent = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  {{ $t("teacher.classrooms.add_student") }}
                </button>
              </div>

              <div v-if="classroom.students.length > 0" class="overflow-x-auto">
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>{{ $t("teacher.classrooms.table.name") }}</th>
                      <th>{{ $t("teacher.classrooms.table.email") }}</th>
                      <th>{{ $t("teacher.classrooms.table.joined_date") }}</th>
                      <th>{{ $t("teacher.classrooms.table.actions") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in classroom.students" :key="student.id">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar placeholder">
                            <div
                              class="bg-neutral text-neutral-content rounded-full w-8"
                            >
                              <span v-if="student.image">
                                <img :src="student.image" />
                              </span>
                              <span v-else>{{
                                student.name.charAt(0).toUpperCase()
                              }}</span>
                            </div>
                          </div>
                          <div class="font-bold">{{ student.name }}</div>
                        </div>
                      </td>
                      <td>{{ student.email }}</td>
                      <td>
                        {{ new Date(student.joinedAt).toLocaleDateString() }}
                      </td>
                      <td>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          @click="removeStudent(student.id)"
                        >
                          {{ $t("teacher.classrooms.table.remove") }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center py-10 opacity-50">
                <p>{{ $t("teacher.classrooms.no_students") }}</p>
              </div>
            </div>
          </div>

          <!-- Homeworks List -->
          <div class="card bg-base-100 shadow-xl border border-base-200">
            <div class="card-body">
              <h2 class="card-title mb-4">
                {{ $t("teacher.classrooms.homeworks") }}
              </h2>

              <div
                v-if="homeworks && homeworks.length > 0"
                class="overflow-x-auto"
              >
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>
                        {{ $t("teacher.classrooms.homework_table.title") }}
                      </th>
                      <th>
                        {{ $t("teacher.classrooms.homework_table.subject") }}
                      </th>
                      <th>
                        {{ $t("teacher.classrooms.homework_table.deadline") }}
                      </th>
                      <th>
                        {{ $t("teacher.classrooms.homework_table.created_at") }}
                      </th>
                      <th>{{ $t("teacher.classrooms.table.actions") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="hw in homeworks" :key="hw.id">
                      <td class="font-bold">
                        {{ hw.title || $t("teacher.classrooms.untitled") }}
                      </td>
                      <td>{{ hw.subject || "-" }}</td>
                      <td>
                        <span
                          :class="{
                            'text-error': new Date(hw.deadline) < new Date(),
                          }"
                        >
                          {{
                            hw.deadline
                              ? new Date(hw.deadline).toLocaleString()
                              : $t("teacher.classrooms.no_deadline")
                          }}
                        </span>
                      </td>
                      <td>
                        {{ new Date(hw.createdAt).toLocaleDateString() }}
                      </td>
                      <td>
                        <NuxtLink
                          :to="localePath(`/teacher/homeworks/${hw.id}`)"
                          class="btn btn-primary btn-sm"
                        >
                          {{ $t("teacher.classrooms.view_hw") }}
                        </NuxtLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center py-10 opacity-50">
                <p>{{ $t("teacher.classrooms.no_homeworks") }}</p>
                <NuxtLink
                  :to="localePath('/teacher/problems')"
                  class="btn btn-link btn-sm mt-2"
                >
                  {{ $t("teacher.classrooms.go_to_problems") }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="error" class="alert alert-error">
          <span
            >{{ $t("teacher.classrooms.error_loading") }}
            {{ error.message }}</span
          >
        </div>

        <div v-else class="flex justify-center py-20">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Add Student Modal -->
        <dialog :class="{ 'modal-open': isAddingStudent }" class="modal">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">
              {{ $t("teacher.classrooms.add_student_modal.title") }}
            </h3>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">{{
                  $t("teacher.classrooms.add_student_modal.select_label")
                }}</span>
              </label>
              <select
                v-model="selectedStudentId"
                class="select select-bordered w-full"
              >
                <option disabled value="">
                  {{
                    $t("teacher.classrooms.add_student_modal.pick_placeholder")
                  }}
                </option>
                <option
                  v-for="student in availableStudents"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.name }} ({{ student.email }})
                </option>
              </select>
              <label class="label">
                <span
                  class="label-text-alt text-warning"
                  v-if="availableStudents.length === 0"
                >
                  {{ $t("teacher.classrooms.add_student_modal.no_students") }}
                </span>
              </label>
            </div>

            <div class="modal-action">
              <button
                class="btn btn-ghost"
                @click="isAddingStudent = false"
                :disabled="isSubmitting"
              >
                {{ $t("teacher.classrooms.create_modal.cancel") }}
              </button>
              <button
                class="btn btn-primary"
                @click="addStudent"
                :disabled="!selectedStudentId || isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="loading loading-spinner"
                ></span>
                {{ $t("teacher.classrooms.add_student_modal.add") }}
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
    <div class="drawer-side">
      <label
        for="settings-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
        <h2 class="text-2xl font-bold mb-6">
          {{ $t("teacher.classrooms.settings_drawer.title") }}
        </h2>
        <form @submit.prevent="updateClassroom" class="space-y-6">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">{{
                $t("teacher.classrooms.settings_drawer.name_label")
              }}</span>
            </label>
            <input
              v-model="settingsForm.name"
              type="text"
              :placeholder="
                $t('teacher.classrooms.settings_drawer.name_placeholder')
              "
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">{{
                $t("teacher.classrooms.settings_drawer.desc_label")
              }}</span>
            </label>
            <textarea
              v-model="settingsForm.description"
              class="textarea textarea-bordered h-24"
              :placeholder="
                $t('teacher.classrooms.settings_drawer.desc_placeholder')
              "
            ></textarea>
          </div>

          <div v-if="settingsError" class="alert alert-error">
            <span>{{ settingsError }}</span>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              type="button"
              class="btn btn-ghost"
              @click="isSettingsOpen = false"
            >
              {{ $t("teacher.classrooms.create_modal.cancel") }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isUpdatingSettings"
            >
              <span
                v-if="isUpdatingSettings"
                class="loading loading-spinner"
              ></span>
              {{ $t("teacher.classrooms.settings_drawer.save") }}
            </button>
          </div>

          <div class="divider">
            {{ $t("teacher.classrooms.settings_drawer.danger_zone") }}
          </div>

          <div>
            <button
              type="button"
              class="btn btn-error btn-outline w-full"
              @click="deleteClassroom"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="loading loading-spinner"></span>
              {{ $t("teacher.classrooms.settings_drawer.delete") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
