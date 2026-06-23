<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const {
  logs,
  loading,
  total,
  page,
  totalPages,
  search,
  eventType,
  toolName,
  userRole,
  status,
  chatId,
  fetchLogs,
  clearFilters,
  filterByChat,
  previousPage,
  nextPage,
} = useAiInteractionLogs();

onMounted(fetchLogs);
</script>

<template>
  <main class="space-y-6 p-4 md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">
        {{ $t("admin.ai_interaction_logs.title") }}
      </h1>
      <span class="text-sm opacity-60">
        {{ $t("admin.ai_interaction_logs.total_records", { count: total }) }}
      </span>
    </div>

    <AdminAiInteractionsFilters
      v-model:search="search"
      v-model:event-type="eventType"
      v-model:tool-name="toolName"
      v-model:user-role="userRole"
      v-model:status="status"
      v-model:chat-id="chatId"
      @clear="clearFilters"
    />

    <AdminAiInteractionsTable
      :logs="logs"
      :loading="loading"
      :page="page"
      :total-pages="totalPages"
      @filter-chat="filterByChat"
      @previous-page="previousPage"
      @next-page="nextPage"
    />
  </main>
</template>
