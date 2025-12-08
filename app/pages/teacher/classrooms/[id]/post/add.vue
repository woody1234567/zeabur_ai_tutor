<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const route = useRoute();
const localePath = useLocalePath();
const classroomId = route.params.id as string;
const router = useRouter();

// Fetch classroom details to get students
const { data: classroom } = await useFetch(
  `/api/teacher/classrooms/${classroomId}`
);

const form = ref({
  classDate: new Date().toISOString().split("T")[0],
  classLength: 60,
  content: "",
  studentId: "",
});

const isSubmitting = ref(false);
const error = ref("");

const submitPost = async () => {
  if (!form.value.content || !form.value.classDate) {
    error.value = "Content and Date are required";
    return;
  }

  isSubmitting.value = true;
  error.value = "";

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}/posts`, {
      method: "POST",
      body: form.value,
    });
    router.push(localePath(`/teacher/classrooms/${classroomId}`));
  } catch (e: any) {
    error.value = e.message || "Failed to create post";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-2xl">
    <div class="mb-6">
      <NuxtLink
        :to="localePath(`/teacher/classrooms/${classroomId}`)"
        class="btn btn-ghost btn-sm gap-2"
      >
        <Icon name="heroicons-solid:arrow-sm-left" class="h-5 w-5 mr-2"></Icon>
        {{ $t("teacher.posts.back", "Back to Classroom") }}
      </NuxtLink>
    </div>

    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body">
        <h1 class="card-title text-2xl mb-6">
          {{ $t("teacher.posts.add_title", "Add New Post") }}
        </h1>

        <form @submit.prevent="submitPost" class="space-y-4">
          <!-- Date -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">
                {{ $t("teacher.posts.date_label", "Class Date") }}
              </span>
            </label>
            <input
              type="date"
              v-model="form.classDate"
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- Length -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">
                {{ $t("teacher.posts.length_label", "Class Length (minutes)") }}
              </span>
            </label>
            <input
              type="number"
              v-model="form.classLength"
              class="input input-bordered w-full"
              min="1"
            />
          </div>

          <!-- Student (Optional) -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">
                {{ $t("teacher.posts.student_label", "Student (Optional)") }}
              </span>
            </label>
            <select
              v-model="form.studentId"
              class="select select-bordered w-full"
            >
              <option value="">
                {{
                  $t(
                    "teacher.posts.all_class",
                    "All Class (No specific student)"
                  )
                }}
              </option>
              <option
                v-if="classroom"
                v-for="student in classroom.students"
                :key="student.id"
                :value="student.id"
              >
                {{ student.name }}
              </option>
            </select>
          </div>

          <!-- Content -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">
                {{ $t("teacher.posts.content_label", "Content / Notes") }}
              </span>
            </label>
            <textarea
              v-model="form.content"
              class="textarea textarea-bordered h-32"
              required
              :placeholder="
                $t(
                  'teacher.posts.content_placeholder',
                  'Enter class notes, homework, or feedback...'
                )
              "
            ></textarea>
          </div>

          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <div class="card-actions justify-end mt-6">
            <button
              type="button"
              class="btn btn-ghost"
              @click="router.back()"
              :disabled="isSubmitting"
            >
              {{ $t("common.cancel", "Cancel") }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              {{ $t("teacher.posts.submit", "Create Post") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
