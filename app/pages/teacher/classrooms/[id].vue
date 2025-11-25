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
</script>

<template>
  <div class="container mx-auto p-6">
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
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold">{{ classroom.name }}</h1>
          <p class="text-lg opacity-70 mt-2">{{ classroom.description }}</p>
        </div>
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
                  <td>{{ new Date(student.joinedAt).toLocaleDateString() }}</td>
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
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
            Add
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
