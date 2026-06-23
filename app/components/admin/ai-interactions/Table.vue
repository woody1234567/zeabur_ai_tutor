<script setup lang="ts">
import type { AiInteractionLog } from "~/types/ai-interaction";

const props = defineProps<{
  logs: AiInteractionLog[];
  loading: boolean;
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  filterChat: [chatId: string];
  previousPage: [];
  nextPage: [];
}>();

const { t } = useI18n();
const expandedId = shallowRef<string | null>(null);

function toggleExpanded(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) return "-";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function eventLabel(eventType: AiInteractionLog["eventType"]) {
  return t(`admin.ai_interaction_logs.event_types.${eventType}`);
}

function eventBadgeClass(eventType: AiInteractionLog["eventType"]) {
  if (eventType === "user_message") return "badge badge-info";
  if (eventType === "assistant_message") return "badge badge-primary";
  return "badge badge-accent";
}

function statusBadgeClass(status: AiInteractionLog["status"]) {
  if (status === "error") return "badge badge-error badge-sm";
  if (status === "aborted") return "badge badge-warning badge-sm";
  return "badge badge-success badge-sm";
}

function summary(log: AiInteractionLog) {
  if (log.eventType === "tool_call") return log.toolName ?? "tool_call";
  return log.content || (log.attachments?.length ? `[${log.attachments.length} attachment]` : "-");
}
</script>

<template>
  <div v-if="props.loading" class="flex justify-center py-12">
    <span class="loading loading-spinner loading-lg" />
  </div>

  <div v-else-if="props.logs.length" class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>{{ $t("admin.ai_interaction_logs.table.time") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.user") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.event") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.status") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.chat") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.content") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.model") }}</th>
          <th>{{ $t("admin.ai_interaction_logs.table.duration") }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="log in props.logs" :key="log.id">
          <tr class="cursor-pointer hover" @click="toggleExpanded(log.id)">
            <td class="whitespace-nowrap text-sm">{{ formatTime(log.createdAt) }}</td>
            <td>
              <div>{{ log.userName || log.userId }}</div>
              <span class="badge badge-outline badge-sm">{{ log.userRole }}</span>
            </td>
            <td>
              <span :class="eventBadgeClass(log.eventType)">
                {{ eventLabel(log.eventType) }}
              </span>
              <div v-if="log.toolName" class="mt-1 text-xs opacity-70">
                {{ log.toolName }}
              </div>
            </td>
            <td>
              <span :class="statusBadgeClass(log.status)">
                {{ $t(`admin.ai_interaction_logs.statuses.${log.status}`) }}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="link max-w-36 truncate text-left text-xs"
                :title="log.chatId"
                @click.stop="emit('filterChat', log.chatId)"
              >
                {{ log.chatId }}
              </button>
            </td>
            <td class="max-w-sm truncate">{{ summary(log) }}</td>
            <td class="text-sm">{{ log.modelId ?? "-" }}</td>
            <td>{{ log.durationMs ?? "-" }}</td>
          </tr>
          <tr v-if="expandedId === log.id">
            <td colspan="8" class="bg-base-200 p-4">
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section>
                  <h3 class="mb-2 font-semibold">
                    {{ $t("admin.ai_interaction_logs.detail.content") }}
                  </h3>
                  <pre class="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-base-300 p-3 text-sm">{{ log.content || "-" }}</pre>
                  <ul v-if="log.attachments?.length" class="mt-3 space-y-1">
                    <li v-for="attachment in log.attachments" :key="attachment.url">
                      <a
                        :href="attachment.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link link-primary break-all"
                      >
                        {{ attachment.filename || attachment.mediaType }}
                      </a>
                    </li>
                  </ul>
                </section>
                <section>
                  <h3 class="mb-2 font-semibold">
                    {{ $t("admin.ai_interaction_logs.detail.metadata") }}
                  </h3>
                  <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt>messageId</dt><dd class="break-all">{{ log.messageId ?? "-" }}</dd>
                    <dt>toolCallId</dt><dd class="break-all">{{ log.toolCallId ?? "-" }}</dd>
                    <dt>finishReason</dt><dd>{{ log.finishReason ?? "-" }}</dd>
                    <dt>step</dt><dd>{{ log.stepNumber ?? "-" }}</dd>
                    <dt>projectId</dt><dd class="break-all">{{ log.projectId ?? "-" }}</dd>
                    <dt>classroomId</dt><dd class="break-all">{{ log.classroomId ?? "-" }}</dd>
                  </dl>
                  <p v-if="log.error" class="mt-3 whitespace-pre-wrap text-sm text-error">
                    {{ log.error }}
                  </p>
                </section>
                <section v-if="log.eventType === 'tool_call'">
                  <h3 class="mb-2 font-semibold">
                    {{ $t("admin.ai_interaction_logs.detail.tool_input") }}
                  </h3>
                  <pre class="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-base-300 p-3 text-sm">{{ formatJson(log.toolInput) }}</pre>
                </section>
                <section v-if="log.eventType === 'tool_call'">
                  <h3 class="mb-2 font-semibold">
                    {{ $t("admin.ai_interaction_logs.detail.tool_output") }}
                  </h3>
                  <pre class="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-base-300 p-3 text-sm">{{ formatJson(log.toolOutput) }}</pre>
                </section>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div class="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        class="btn btn-sm"
        :disabled="props.page <= 1"
        @click="emit('previousPage')"
      >
        {{ $t("admin.ai_interaction_logs.pagination.previous") }}
      </button>
      <span class="text-sm">
        {{
          $t("admin.ai_interaction_logs.pagination.page_of", {
            current: props.page,
            total: props.totalPages,
          })
        }}
      </span>
      <button
        type="button"
        class="btn btn-sm"
        :disabled="props.page >= props.totalPages"
        @click="emit('nextPage')"
      >
        {{ $t("admin.ai_interaction_logs.pagination.next") }}
      </button>
    </div>
  </div>

  <div v-else class="py-12 text-center opacity-60">
    {{ $t("admin.ai_interaction_logs.table.no_results") }}
  </div>
</template>
