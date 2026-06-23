import type {
  AiInteractionEventType,
  AiInteractionLog,
  AiInteractionLogsResponse,
  AiInteractionStatus,
} from "~/types/ai-interaction";

export function useAiInteractionLogs() {
  const logs = shallowRef<AiInteractionLog[]>([]);
  const loading = shallowRef(true);
  const total = shallowRef(0);
  const page = shallowRef(1);
  const pageSize = 50;
  const search = shallowRef("");
  const eventType = shallowRef<AiInteractionEventType | "">("");
  const toolName = shallowRef("");
  const userRole = shallowRef("");
  const status = shallowRef<AiInteractionStatus | "">("");
  const chatId = shallowRef("");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

  async function fetchLogs() {
    loading.value = true;
    try {
      const response = await $fetch<AiInteractionLogsResponse>(
        "/api/admin/ai-interaction-logs",
        {
          query: {
            search: search.value || undefined,
            eventType: eventType.value || undefined,
            toolName: toolName.value || undefined,
            userRole: userRole.value || undefined,
            status: status.value || undefined,
            chatId: chatId.value || undefined,
            limit: pageSize,
            offset: (page.value - 1) * pageSize,
          },
        },
      );
      logs.value = response.logs;
      total.value = response.total;
    } catch (error) {
      console.error("Failed to fetch AI interaction logs", error);
    } finally {
      loading.value = false;
    }
  }

  function refreshFromFirstPage() {
    page.value = 1;
    void fetchLogs();
  }

  watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshFromFirstPage, 300);
  });

  watch([eventType, toolName, userRole, status, chatId], refreshFromFirstPage);

  onScopeDispose(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  function clearFilters() {
    search.value = "";
    eventType.value = "";
    toolName.value = "";
    userRole.value = "";
    status.value = "";
    chatId.value = "";
  }

  function filterByChat(selectedChatId: string) {
    chatId.value = selectedChatId;
  }

  function previousPage() {
    if (page.value <= 1) return;
    page.value--;
    void fetchLogs();
  }

  function nextPage() {
    if (page.value >= totalPages.value) return;
    page.value++;
    void fetchLogs();
  }

  return {
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
  };
}
