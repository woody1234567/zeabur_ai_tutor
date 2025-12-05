<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const localePath = useLocalePath();
const {
  data: students,
  pending,
  error,
} = await useFetch("/api/teacher/my-students");
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <h1 class="text-2xl md:text-3xl font-bold mb-6">
      {{ $t("teacher.students_dashboard.title") }}
    </h1>

    <div v-if="pending" class="flex justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>Error loading students: {{ error.message }}</span>
    </div>

    <div
      v-else-if="students && students.length > 0"
      class="card bg-base-100 shadow-xl border border-base-200"
    >
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ $t("teacher.students_dashboard.name") }}</th>
                <th>{{ $t("teacher.students_dashboard.email") }}</th>
                <th>{{ $t("teacher.students_dashboard.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="avatar placeholder">
                      <div
                        class="bg-neutral text-neutral-content rounded-full w-10"
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
                  <NuxtLink
                    :to="
                      localePath(`/teacher/students_dashboard/${student.id}`)
                    "
                    class="btn btn-sm btn-primary"
                  >
                    {{ $t("teacher.students_dashboard.view_classrooms") }}
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10 opacity-50">
      <p>No students found in your classrooms.</p>
    </div>
  </div>
</template>
