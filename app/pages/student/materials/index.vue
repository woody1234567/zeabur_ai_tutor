<script setup lang="ts">
import type { classrooms } from "~~/db/schema";

definePageMeta({
  layout: "student",
});

const { data: userClassrooms, status } = await useFetch<
  (typeof classrooms.$inferSelect)[]
>("/api/student/classrooms");
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Class Materials</h1>

    <div v-if="status === 'pending'" class="flex justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-else-if="!userClassrooms || userClassrooms.length === 0"
      class="alert alert-info"
    >
      <Icon name="heroicons:information-circle" class="w-6 h-6" />
      <span>You have not joined any classrooms yet.</span>
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="classroom in userClassrooms"
        :key="classroom.id"
        class="card bg-base-100 shadow-xl"
      >
        <div class="card-body">
          <h2 class="card-title text-2xl border-b pb-2 mb-4">
            {{ classroom.name }}
          </h2>
          <ClassroomMaterialsList
            :classroomId="classroom.id"
            userType="student"
          />
        </div>
      </div>
    </div>
  </div>
</template>
