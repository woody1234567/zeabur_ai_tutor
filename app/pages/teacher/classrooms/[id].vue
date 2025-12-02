<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

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
  if (!confirm("Are you sure you want to remove this student?")) return;

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
          <NuxtLink to="/teacher/classrooms" class="btn btn-ghost btn-sm gap-2">
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
            Back to Classrooms
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
              <button class="btn btn-primary" @click="isAddingStudent = true">
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
                Add Student
              </button>
              <button
                class="btn btn-ghost btn-circle"
                title="Settings"
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
              <h2 class="card-title mb-4">
                Enrolled Students ({{ classroom.students.length }})
              </h2>

              <div v-if="classroom.students.length > 0" class="overflow-x-auto">
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center py-10 opacity-50">
                <p>No students enrolled yet.</p>
              </div>
            </div>
          </div>

          <!-- Homeworks List -->
          <div class="card bg-base-100 shadow-xl border border-base-200">
            <div class="card-body">
              <h2 class="card-title mb-4">Homeworks</h2>

              <div
                v-if="homeworks && homeworks.length > 0"
                class="overflow-x-auto"
              >
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Deadline</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="hw in homeworks" :key="hw.id">
                      <td class="font-bold">{{ hw.title || "Untitled" }}</td>
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
                              : "No deadline"
                          }}
                        </span>
                      </td>
                      <td>
                        {{ new Date(hw.createdAt).toLocaleDateString() }}
                      </td>
                      <td>
                        <NuxtLink
                          :to="`/teacher/homeworks/${hw.id}`"
                          class="btn btn-sm btn-primary"
                        >
                          View HW
                        </NuxtLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="text-center py-10 opacity-50">
                <p>No homeworks assigned to this classroom yet.</p>
                <NuxtLink
                  to="/teacher/problems"
                  class="btn btn-link btn-sm mt-2"
                >
                  Go to Problems to create HW
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="error" class="alert alert-error">
          <span>Error loading classroom: {{ error.message }}</span>
        </div>

        <div v-else class="flex justify-center py-20">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Add Student Modal -->
        <dialog :class="{ 'modal-open': isAddingStudent }" class="modal">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Add Student to Class</h3>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Select Student</span>
              </label>
              <select
                v-model="selectedStudentId"
                class="select select-bordered w-full"
              >
                <option disabled value="">Pick a student</option>
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
                  No available students to add.
                </span>
              </label>
            </div>

            <div class="modal-action">
              <button
                class="btn btn-ghost"
                @click="isAddingStudent = false"
                :disabled="isSubmitting"
              >
                Cancel
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
                Add
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
        <h2 class="text-2xl font-bold mb-6">Classroom Settings</h2>
        <form @submit.prevent="updateClassroom" class="space-y-6">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Classroom Name</span>
            </label>
            <input
              v-model="settingsForm.name"
              type="text"
              placeholder="e.g. Advanced Mathematics"
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Description</span>
            </label>
            <textarea
              v-model="settingsForm.description"
              class="textarea textarea-bordered h-24"
              placeholder="Describe your classroom..."
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
              Cancel
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
