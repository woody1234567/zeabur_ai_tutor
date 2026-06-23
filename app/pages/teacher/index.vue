<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
</script>

<template>
  <div class="p-4 md:p-6">
    <h1 class="text-2xl font-bold mb-6">{{ $t("teacher.dashboard.title") }}</h1>
    <LazyCommonEventCalendar />
  </div>
</template>
