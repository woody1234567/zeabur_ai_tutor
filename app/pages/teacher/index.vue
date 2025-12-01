<script setup lang="ts">
import EventCalendar from "~/components/common/EventCalendar.vue";

definePageMeta({
  layout: "teacher",
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Teacher Dashboard</h1>
    <EventCalendar />
  </div>
</template>
