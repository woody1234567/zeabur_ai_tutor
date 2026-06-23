<script setup lang="ts">
interface SharedTestbank {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

const props = defineProps<{
  classroomId: string;
  userType: "teacher" | "student";
}>();

const apiEndpoint = computed(() =>
  props.userType === "teacher"
    ? `/api/teacher/classrooms/${props.classroomId}/testbanks`
    : `/api/student/classrooms/${props.classroomId}/testbanks`
);

const {
  data: testbanks,
  pending,
  error,
} = await useFetch<SharedTestbank[]>(apiEndpoint);
</script>

<template>
  <div>
    <div v-if="pending" class="flex justify-center py-6">
      <span class="loading loading-spinner"></span>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <div
      v-else-if="testbanks && testbanks.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="testbank in testbanks"
        :key="testbank.id"
        class="card bg-base-100 border border-base-200 shadow-sm"
      >
        <div class="card-body p-4">
          <h3 class="card-title text-base">{{ testbank.name }}</h3>
          <p
            v-if="testbank.description"
            class="text-sm text-base-content/70 line-clamp-2"
          >
            {{ testbank.description }}
          </p>
          <div class="mt-2">
            <div class="badge badge-ghost badge-outline">
              {{
                $t("teacher.problems.testbanks.problem_count", {
                  count: testbank.problemCount,
                })
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10 opacity-50">
      <p>{{ $t("components.shared_testbanks.empty") }}</p>
    </div>
  </div>
</template>
