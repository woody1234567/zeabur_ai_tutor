<script setup lang="ts">
definePageMeta({ layout: "student" });

const { t } = useI18n();
const localePath = useLocalePath();

interface TeacherSummary {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

const { data: teachers, status } = await useFetch<TeacherSummary[]>(
  "/api/student/teachers"
);

const sortedTeachers = computed(() =>
  [...(teachers.value || [])].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email)
  )
);
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">{{ t("student.teachers.title") }}</h1>
        <p class="text-sm opacity-70 mt-1">
          {{ t("student.teachers.description") }}
        </p>
      </div>
      <span class="badge badge-neutral">
        {{ t("student.teachers.count", { count: sortedTeachers.length }) }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="flex items-center justify-center gap-3 py-16">
      <span class="loading loading-spinner loading-md"></span>
      <span class="opacity-70">{{ t("student.teachers.loading") }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="sortedTeachers.length === 0" class="alert">
      <span>{{ t("student.teachers.no_teachers") }}</span>
    </div>

    <!-- Teacher grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="teacher in sortedTeachers"
        :key="teacher.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div class="avatar placeholder">
              <div
                class="bg-neutral text-neutral-content rounded-full w-12 h-12"
              >
                <span v-if="teacher.image">
                  <img :src="teacher.image" :alt="teacher.name || teacher.email" class="rounded-full" />
                </span>
                <span v-else class="text-lg">
                  {{ (teacher.name || teacher.email).slice(0, 1).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold truncate">
                {{ teacher.name || "Teacher" }}
              </h3>
              <p class="text-sm opacity-70 truncate">{{ teacher.email }}</p>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <NuxtLink
              :to="localePath(`/student/teachers/${teacher.id}`)"
              class="btn btn-primary btn-sm"
            >
              {{ t("student.teachers.view_availability") }}
              <Icon name="heroicons-outline:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
