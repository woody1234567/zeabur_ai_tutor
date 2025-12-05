<script setup lang="ts">
defineProps<{
  classrooms: any[];
  baseLink: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="classroom in classrooms"
      :key="classroom.id"
      class="card bg-base-100 shadow-xl border border-base-200"
    >
      <div class="card-body">
        <h2 class="card-title">{{ classroom.name }}</h2>
        <p class="text-sm opacity-70">
          {{
            classroom.description ||
            $t("components.student.classrooms_list.no_description")
          }}
        </p>
        <div class="mt-4">
          <div class="badge badge-outline gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block w-4 h-4 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            {{ $t("components.student.classrooms_list.teacher") }}:
            {{ classroom.teacherName }}
          </div>
        </div>
        <div class="card-actions justify-end mt-4">
          <span class="text-xs opacity-50 mr-auto self-center"
            >{{ $t("components.student.classrooms_list.joined") }}:
            {{ new Date(classroom.joinedAt).toLocaleDateString() }}</span
          >
          <NuxtLink
            :to="`${baseLink}/${classroom.id}`"
            class="btn btn-primary btn-sm"
          >
            {{ $t("components.student.classrooms_list.view_performance") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
