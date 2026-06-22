<script setup lang="ts">
definePageMeta({
  layout: "admin",
});
const { t } = useI18n();

interface AiToolLog {
  id: string;
  userId: string;
  userName: string | null;
  userRole: string | null;
  toolName: string;
  userMessage: string | null;
  args: Record<string, unknown> | null;
  resultSummary: string | null;
  resultCount: number | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

const logs = ref<AiToolLog[]>([]);
const loading = ref(true);
const total = ref(0);
const page = ref(1);
const pageSize = 50;
const search = ref("");
const toolNameFilter = ref("");
const userRoleFilter = ref("");
const hasErrorFilter = ref(false);
const expandedId = ref<string | null>(null);

let debounceTimer: NodeJS.Timeout;

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/ai-tool-logs", {
      query: {
        search: search.value || undefined,
        toolName: toolNameFilter.value || undefined,
        userRole: userRoleFilter.value || undefined,
        hasError: hasErrorFilter.value ? "true" : undefined,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
      },
    });
    logs.value = res.logs as AiToolLog[];
    total.value = res.total;
  } catch (error) {
    console.error("Failed to fetch AI tool logs", error);
  } finally {
    loading.value = false;
  }
};

watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchLogs();
  }, 300);
});

watch([toolNameFilter, userRoleFilter, hasErrorFilter], () => {
  page.value = 1;
  fetchLogs();
});

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const totalPages = computed(() => Math.ceil(total.value / pageSize));

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};

const durationClass = (ms: number | null) => {
  if (ms === null) return "";
  if (ms < 500) return "text-success";
  if (ms < 2000) return "text-warning";
  return "text-error";
};

const toolBadgeClass = (name: string) => {
  switch (name) {
    case "search_problems":
      return "badge badge-info";
    case "create_problem":
      return "badge badge-success";
    case "recommend_materials":
      return "badge badge-warning";
    default:
      return "badge badge-ghost";
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
    fetchLogs();
  }
};

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
    fetchLogs();
  }
};

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">
      {{ $t("admin.ai_tool_logs.title") }}
    </h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <input
        v-model="search"
        type="text"
        :placeholder="$t('admin.ai_tool_logs.search_placeholder')"
        class="input input-bordered w-full max-w-xs"
      />
      <select v-model="toolNameFilter" class="select select-bordered">
        <option value="">{{ $t("admin.ai_tool_logs.all_tools") }}</option>
        <option value="search_problems">search_problems</option>
        <option value="create_problem">create_problem</option>
        <option value="recommend_materials">recommend_materials</option>
      </select>
      <select v-model="userRoleFilter" class="select select-bordered">
        <option value="">{{ $t("admin.ai_tool_logs.all_roles") }}</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
      <label class="label cursor-pointer gap-2">
        <input
          v-model="hasErrorFilter"
          type="checkbox"
          class="checkbox checkbox-error"
        />
        <span class="label-text">{{
          $t("admin.ai_tool_logs.filter_errors_only")
        }}</span>
      </label>
      <span class="text-sm opacity-60 ml-auto">
        {{ $t("admin.ai_tool_logs.pagination.total_records", { count: total }) }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Table -->
    <div v-else-if="logs.length > 0" class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>{{ $t("admin.ai_tool_logs.table.time") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.user") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.role") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.tool") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.message") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.result_count") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.duration") }}</th>
            <th>{{ $t("admin.ai_tool_logs.table.error") }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="log in logs" :key="log.id">
            <tr
              class="hover cursor-pointer"
              @click="toggleExpand(log.id)"
            >
              <td class="whitespace-nowrap text-sm">
                {{ formatTime(log.createdAt) }}
              </td>
              <td>{{ log.userName || log.userId }}</td>
              <td>
                <span class="badge badge-outline badge-sm">{{
                  log.userRole
                }}</span>
              </td>
              <td>
                <span :class="toolBadgeClass(log.toolName)">{{
                  log.toolName
                }}</span>
              </td>
              <td class="max-w-xs truncate">{{ log.userMessage }}</td>
              <td>{{ log.resultCount ?? "-" }}</td>
              <td :class="durationClass(log.durationMs)">
                {{ log.durationMs ?? "-" }}
              </td>
              <td>
                <span v-if="log.error" class="badge badge-error badge-sm">
                  Error
                </span>
              </td>
            </tr>
            <!-- Expanded detail row -->
            <tr v-if="expandedId === log.id">
              <td colspan="8" class="bg-base-200 p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 class="font-semibold mb-2">
                      {{ $t("admin.ai_tool_logs.detail.arguments") }}
                    </h4>
                    <pre class="text-sm bg-base-300 p-3 rounded-lg overflow-auto max-h-60">{{ JSON.stringify(log.args, null, 2) }}</pre>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-2">
                      {{ $t("admin.ai_tool_logs.detail.result") }}
                    </h4>
                    <pre class="text-sm bg-base-300 p-3 rounded-lg overflow-auto max-h-60">{{ log.resultSummary }}</pre>
                    <p v-if="log.error" class="mt-2 text-error text-sm">
                      {{ log.error }}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex justify-center items-center gap-4 mt-6">
        <button
          class="btn btn-sm"
          :disabled="page <= 1"
          @click="prevPage"
        >
          {{ $t("admin.ai_tool_logs.pagination.previous") }}
        </button>
        <span class="text-sm">
          {{
            $t("admin.ai_tool_logs.pagination.page_of", {
              current: page,
              total: totalPages,
            })
          }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          {{ $t("admin.ai_tool_logs.pagination.next") }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12 opacity-60">
      {{ $t("admin.ai_tool_logs.table.no_results") }}
    </div>
  </div>
</template>
