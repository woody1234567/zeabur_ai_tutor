<script setup lang="ts">
import type {
  AiInteractionEventType,
  AiInteractionStatus,
} from "~/types/ai-interaction";

const search = defineModel<string>("search", { required: true });
const eventType = defineModel<AiInteractionEventType | "">("eventType", {
  required: true,
});
const toolName = defineModel<string>("toolName", { required: true });
const userRole = defineModel<string>("userRole", { required: true });
const status = defineModel<AiInteractionStatus | "">("status", {
  required: true,
});
const chatId = defineModel<string>("chatId", { required: true });

defineEmits<{
  clear: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <input
      v-model="search"
      type="search"
      :placeholder="$t('admin.ai_interaction_logs.search_placeholder')"
      class="input input-bordered w-full max-w-xs"
    />
    <select v-model="eventType" class="select select-bordered">
      <option value="">
        {{ $t("admin.ai_interaction_logs.filters.all_events") }}
      </option>
      <option value="user_message">
        {{ $t("admin.ai_interaction_logs.event_types.user_message") }}
      </option>
      <option value="assistant_message">
        {{ $t("admin.ai_interaction_logs.event_types.assistant_message") }}
      </option>
      <option value="tool_call">
        {{ $t("admin.ai_interaction_logs.event_types.tool_call") }}
      </option>
    </select>
    <select v-model="toolName" class="select select-bordered">
      <option value="">
        {{ $t("admin.ai_interaction_logs.filters.all_tools") }}
      </option>
      <option value="search_problems">search_problems</option>
      <option value="create_problem">create_problem</option>
      <option value="recommend_materials">recommend_materials</option>
      <option value="web_search">web_search</option>
    </select>
    <select v-model="userRole" class="select select-bordered">
      <option value="">
        {{ $t("admin.ai_interaction_logs.filters.all_roles") }}
      </option>
      <option value="student">Student</option>
      <option value="teacher">Teacher</option>
    </select>
    <select v-model="status" class="select select-bordered">
      <option value="">
        {{ $t("admin.ai_interaction_logs.filters.all_statuses") }}
      </option>
      <option value="completed">
        {{ $t("admin.ai_interaction_logs.statuses.completed") }}
      </option>
      <option value="aborted">
        {{ $t("admin.ai_interaction_logs.statuses.aborted") }}
      </option>
      <option value="error">
        {{ $t("admin.ai_interaction_logs.statuses.error") }}
      </option>
    </select>
    <input
      v-model="chatId"
      type="search"
      :placeholder="$t('admin.ai_interaction_logs.filters.chat_id')"
      class="input input-bordered w-full max-w-xs"
    />
    <button type="button" class="btn btn-ghost" @click="$emit('clear')">
      {{ $t("admin.ai_interaction_logs.filters.clear") }}
    </button>
  </div>
</template>
