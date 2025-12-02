<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const { data: classrooms, refresh } = await useFetch("/api/teacher/classrooms");

const isCreating = ref(false);
const newClassroom = ref({
  name: "",
  description: "",
});
const isSubmitting = ref(false);

const createClassroom = async () => {
  if (!newClassroom.value.name) return;

  isSubmitting.value = true;
  try {
    await $fetch("/api/teacher/classrooms", {
      method: "POST",
      body: newClassroom.value,
    });
    await refresh();
    isCreating.value = false;
    newClassroom.value = { name: "", description: "" };
  } catch (e) {
    console.error("Failed to create classroom", e);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Classrooms</h1>
      <button class="btn btn-primary" @click="isCreating = true">
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Classroom
      </button>
    </div>

    <!-- Create Modal -->
    <dialog :class="{ 'modal-open': isCreating }" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Create New Classroom</h3>
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Classroom Name</span>
          </label>
          <input
            v-model="newClassroom.name"
            type="text"
            placeholder="e.g. Physics 101"
            class="input input-bordered w-full"
          />
        </div>
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text">Description (Optional)</span>
          </label>
          <textarea
            v-model="newClassroom.description"
            class="textarea textarea-bordered h-24"
            placeholder="Brief description of the class..."
          ></textarea>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="isCreating = false"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="createClassroom"
            :disabled="!newClassroom.name || isSubmitting"
          >
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
            Create
          </button>
        </div>
      </div>
    </dialog>

    <!-- Classroom List -->
    <div
      v-if="classrooms && classrooms.length > 0"
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="classroom in classrooms"
        :key="classroom.id"
        class="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors cursor-pointer"
      >
        <div class="card-body">
          <h2 class="card-title">{{ classroom.name }}</h2>
          <p class="text-sm opacity-70 line-clamp-2">
            {{ classroom.description || "No description provided." }}
          </p>
          <div class="card-actions justify-end mt-4">
            <NuxtLink
              :to="`/teacher/classrooms/${classroom.id}`"
              class="btn btn-sm btn-ghost"
              >View Details</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 opacity-50">
      <div class="text-6xl mb-4">🏫</div>
      <h3 class="text-xl font-bold">No classrooms yet</h3>
      <p>Create your first classroom to get started.</p>
    </div>
  </div>
</template>
