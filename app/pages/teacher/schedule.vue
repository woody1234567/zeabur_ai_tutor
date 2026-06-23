<script setup lang="ts">
definePageMeta({ layout: "teacher" });
const { t } = useI18n();
</script>

<template>
  <div class="container mx-auto">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">{{ t("teacher.schedule.title") }}</h1>
        <p class="text-sm opacity-70 mt-1">
          {{ t("teacher.schedule.description") }}
        </p>
      </div>
    </div>

    <TeacherScheduleCalendar />
  </div>
</template>
