<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const route = useRoute();
const router = useRouter();
const classroomId = route.params.id as string;

const { data: classroom, refresh } = await useFetch(
  `/api/teacher/classrooms/${classroomId}`
);

const form = ref({
  name: "",
  description: "",
});

// Initialize form with existing data
watchEffect(() => {
  if (classroom.value) {
    form.value.name = classroom.value.name;
    form.value.description = classroom.value.description || "";
  }
});

const isSubmitting = ref(false);
const errorMessage = ref("");

const updateClassroom = async () => {
  if (!form.value.name) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}`, {
      method: "PUT",
      body: form.value,
    });
    router.push(`/teacher/classrooms/${classroomId}`);
  } catch (e: any) {
    errorMessage.value = e.message || "Failed to update classroom";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto p-6 max-w-2xl">
    <div class="mb-6">
      <NuxtLink
        :to="`/teacher/classrooms/${classroomId}`"
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
        Back to Classroom
      </NuxtLink>
    </div>

    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-6">Classroom Settings</h2>

        <form @submit.prevent="updateClassroom" class="space-y-6">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Classroom Name</span>
            </label>
            <input
              v-model="form.name"
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
              v-model="form.description"
              class="textarea textarea-bordered h-24"
              placeholder="Describe your classroom..."
            ></textarea>
          </div>

          <div v-if="errorMessage" class="alert alert-error">
            <span>{{ errorMessage }}</span>
          </div>

          <div class="card-actions justify-end mt-4">
            <NuxtLink
              :to="`/teacher/classrooms/${classroomId}`"
              class="btn btn-ghost"
            >
              Cancel
            </NuxtLink>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
