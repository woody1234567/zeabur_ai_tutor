<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const {
  data: homeworks,
  pending,
  error,
} = await useFetch("/api/teacher/homeworks");

const formatDate = (dateString: string | null) => {
  if (!dateString) return useNuxtApp().$i18n.t("teacher.homeworks.no_deadline");
  return new Date(dateString).toLocaleDateString();
};
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-primary">
        {{ $t("teacher.homeworks.title") }}
      </h1>
      <NuxtLink to="/teacher/homeworks/create" class="btn btn-primary">
        {{ $t("teacher.homeworks.create_button") }}
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span
        >{{ $t("teacher.homeworks.error_loading") }} {{ error.message }}</span
      >
    </div>

    <div
      v-else-if="!homeworks || homeworks.length === 0"
      class="text-center py-10"
    >
      <p class="text-xl text-gray-500">
        {{ $t("teacher.homeworks.no_homeworks") }}
      </p>
      <NuxtLink to="/teacher/homeworks/create" class="btn btn-primary mt-4">
        {{ $t("teacher.homeworks.create_button") }}
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="hw in homeworks"
        :key="hw.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
      >
        <div class="card-body">
          <h2 class="card-title text-2xl mb-2">{{ hw.title }}</h2>
          <div class="badge badge-secondary mb-4">{{ hw.subject }}</div>

          <div class="space-y-2">
            <div class="flex items-center text-sm">
              <span class="font-semibold w-24">{{
                $t("teacher.homeworks.classroom_label")
              }}</span>
              <span>{{
                hw.classroomName || $t("teacher.homeworks.unknown_classroom")
              }}</span>
            </div>
            <div class="flex items-center text-sm">
              <span class="font-semibold w-24">{{
                $t("teacher.homeworks.deadline_label")
              }}</span>
              <span
                :class="{
                  'text-error':
                    hw.deadline && new Date(hw.deadline) < new Date(),
                }"
              >
                {{ formatDate(hw.deadline) }}
              </span>
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <span class="font-semibold w-24">{{
                $t("teacher.homeworks.created_label")
              }}</span>
              <span>{{ new Date(hw.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="card-actions justify-end mt-6">
            <NuxtLink
              :to="`/teacher/homeworks/${hw.id}`"
              class="btn btn-primary btn-sm"
              >{{ $t("teacher.homeworks.view_details") }}</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
