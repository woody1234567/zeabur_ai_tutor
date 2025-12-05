<script setup lang="ts">
import type { classrooms, homeworks } from "~~/db/schema";

definePageMeta({
  layout: "student",
});

type HomeworkGroup = {
  classroom: typeof classrooms.$inferSelect;
  homeworks: (typeof homeworks.$inferSelect & { isCompleted: boolean })[];
};

const { data: groupedHomeworks, status } = await useFetch<HomeworkGroup[]>(
  "/api/student/homeworks"
);
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">{{ $t("homeworks.title") }}</h1>

    <div v-if="status === 'pending'" class="flex justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="!groupedHomeworks || groupedHomeworks.length === 0">
      <div class="alert alert-info">
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
        <span>{{ $t("homeworks.no_assignments") }}</span>
      </div>
    </div>

    <div v-else class="space-y-8">
      <div
        v-for="group in groupedHomeworks"
        :key="group.classroom.id"
        class="card bg-base-100 shadow-xl"
      >
        <div class="card-body">
          <h2 class="card-title text-2xl border-b pb-2 mb-4">
            {{ group.classroom.name }}
          </h2>

          <div v-if="group.homeworks.length === 0" class="text-gray-500 italic">
            {{ $t("homeworks.no_homework_in_class") }}
          </div>

          <div
            v-else
            class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="hw in group.homeworks"
              :key="hw.id"
              class="card bg-base-200 hover:bg-base-300 transition-colors duration-200"
            >
              <div class="card-body">
                <h3 class="card-title text-lg">{{ hw.title }}</h3>
                <p class="text-sm text-gray-600">
                  {{ $t("homeworks.subject") }} {{ hw.subject || "N/A" }}
                </p>
                <p class="text-sm">
                  {{ $t("homeworks.deadline") }}
                  <span
                    :class="{
                      'text-error font-bold':
                        hw.deadline && new Date(hw.deadline) < new Date(),
                    }"
                  >
                    {{
                      hw.deadline
                        ? new Date(hw.deadline).toLocaleDateString()
                        : $t("homeworks.no_deadline")
                    }}
                  </span>
                </p>
                <div class="card-actions justify-end mt-4">
                  <NuxtLink
                    v-if="hw.isCompleted"
                    :to="`/student/homeworks/review/${hw.id}`"
                    class="btn btn-sm btn-secondary"
                  >
                    {{ $t("homeworks.review_hw") }}
                  </NuxtLink>
                  <NuxtLink
                    v-else
                    :to="`/student/homeworks/${hw.id}`"
                    class="btn btn-sm btn-primary"
                  >
                    {{
                      hw.isCompleted
                        ? $t("homeworks.completed")
                        : $t("homeworks.start_hw")
                    }}
                  </NuxtLink>
                </div>
                <!-- Future enhancement: Add link to homework details/submission page -->
                <!-- <div class="card-actions justify-end mt-4">
                  <NuxtLink :to="`/student/homeworks/${hw.id}`" class="btn btn-primary btn-sm">View</NuxtLink>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
