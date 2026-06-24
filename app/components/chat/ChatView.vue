<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport, isToolUIPart } from "ai";
import type { UIMessage, FileUIPart } from "ai";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt?: string | null;
}

const props = withDefaults(
  defineProps<{
    role: "student" | "teacher";
    extraBody?: () => Record<string, any>;
    prepareMessage?: (payload: {
      text: string;
    }) => Promise<{ text: string; files?: FileUIPart[] } | null>;
    allowEmptyText?: boolean;
    sendDisabled?: boolean;
  }>(),
  {
    extraBody: undefined,
    prepareMessage: undefined,
    allowEmptyText: false,
    sendDisabled: false,
  }
);

const { t } = useI18n();
const ct = (key: string) => t(`${props.role}.chat.${key}`);

const apiPrefix = `/api/${props.role}`;

const chatId = ref(crypto.randomUUID());
const currentProjectId = ref<string | null>(null);
const userMessage = ref("");

const projects = ref<Project[]>([]);
const showProjectDialog = ref(false);
const editingProject = ref<Project | null>(null);
const showMoveChatDialog = ref(false);
const movingChatId = ref<string | null>(null);

const { data: chatHistoryList, refresh: refreshHistory } = await useFetch(
  `${apiPrefix}/chats`
);
const { data: projectList, refresh: refreshProjects } = await useFetch(
  `${apiPrefix}/projects`
);

const chats = ref<any[]>([]);
watch(
  chatHistoryList,
  (newList) => {
    if (newList) chats.value = newList as any[];
  },
  { immediate: true }
);
watch(
  projectList,
  (newList) => {
    if (newList) projects.value = newList as Project[];
  },
  { immediate: true }
);

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `${apiPrefix}/chat`,
    body: () => ({
      chatId: chatId.value,
      projectId: currentProjectId.value,
      ...(props.extraBody?.() ?? {}),
    }),
  }),
  onFinish: () => {
    refreshHistory();
  },
  onError: (error) => {
    console.error("Chat error:", error);
  },
});

const messages = computed(() => chat.messages);
const isLoading = computed(() => chat.status !== "ready");

function getTextContent(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function getActiveToolName(msg: UIMessage): string | null {
  for (const part of msg.parts) {
    if (isToolUIPart(part) && "state" in part) {
      if (part.state !== "output-available" && part.state !== "output-error") {
        return "toolName" in part
          ? (part as any).toolName
          : part.type.replace(/^tool-/, "");
      }
    }
  }
  return null;
}

const activeToolStatus = computed(() => {
  const lastMsg = messages.value.at(-1);
  if (!lastMsg || lastMsg.role !== "assistant") return null;
  return getActiveToolName(lastMsg);
});

const displayMessages = computed(() =>
  messages.value.filter(
    (msg) =>
      msg.role === "user" ||
      (msg.role === "assistant" && getTextContent(msg))
  )
);

async function loadChat(id: string) {
  chatId.value = id as `${string}-${string}-${string}-${string}-${string}`;
  const chatData = chats.value.find((c) => c.id === id);
  if (chatData) currentProjectId.value = chatData.projectId ?? null;
  const { data } = await useFetch(`${apiPrefix}/chats/${id}`);
  if (data.value) {
    chat.messages = (data.value as any).messages as UIMessage[];
  }
}

function startNewChat(projectId?: string | null) {
  chatId.value = crypto.randomUUID();
  currentProjectId.value = projectId ?? null;
  chat.messages = [];
}

function selectProject(projectId: string | null) {
  currentProjectId.value = projectId;
}

function openCreateProject() {
  editingProject.value = null;
  showProjectDialog.value = true;
}

function openEditProject(project: Project) {
  editingProject.value = project;
  showProjectDialog.value = true;
}

async function saveProject(data: {
  name: string;
  description: string;
  systemPrompt: string;
}) {
  if (editingProject.value) {
    await $fetch(`${apiPrefix}/projects/${editingProject.value.id}`, {
      method: "PUT",
      body: data,
    });
  } else {
    await $fetch(`${apiPrefix}/projects`, {
      method: "POST",
      body: data,
    });
  }
  await refreshProjects();
}

async function handleDeleteProject(id: string) {
  if (!confirm(t("chat.confirm_delete_project"))) return;
  await $fetch(`${apiPrefix}/projects/${id}`, { method: "DELETE" });
  if (currentProjectId.value === id) currentProjectId.value = null;
  await Promise.all([refreshProjects(), refreshHistory()]);
}

function openMoveChat(chatMoveId: string) {
  movingChatId.value = chatMoveId;
  showMoveChatDialog.value = true;
}

async function handleMoveChat(projectId: string | null) {
  if (!movingChatId.value) return;
  await $fetch(`${apiPrefix}/chats/${movingChatId.value}/project`, {
    method: "PUT",
    body: { projectId },
  });
  await refreshHistory();
}

const currentProject = computed(() =>
  projects.value.find((p) => p.id === currentProjectId.value)
);

const movingChatProjectId = computed(() => {
  const c = chats.value.find((c) => c.id === movingChatId.value);
  return c?.projectId ?? null;
});

async function sendMessage() {
  const hasText = userMessage.value.trim();
  if (!hasText && !props.allowEmptyText) return;
  if (isLoading.value || props.sendDisabled) return;

  const text = userMessage.value;
  userMessage.value = "";

  if (props.prepareMessage) {
    const result = await props.prepareMessage({ text });
    if (!result) {
      userMessage.value = text;
      return;
    }
    await chat.sendMessage({
      text: result.text,
      ...(result.files?.length ? { files: result.files } : {}),
    });
  } else {
    await chat.sendMessage({ text });
  }
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex">
    <!-- Sidebar -->
    <ChatProjectSidebar
      :projects="projects"
      :chats="chats"
      :current-chat-id="chatId"
      :current-project-id="currentProjectId"
      @load-chat="loadChat"
      @start-new-chat="startNewChat"
      @create-project="openCreateProject"
      @edit-project="openEditProject"
      @delete-project="handleDeleteProject"
      @move-chat="openMoveChat"
      @select-project="selectProject"
    />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col bg-base-100">
      <!-- Project indicator -->
      <div
        v-if="currentProject"
        class="px-4 py-2 border-b border-base-300 bg-base-200/50 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span class="text-sm font-medium">{{ currentProject.name }}</span>
        <span
          v-if="currentProject.systemPrompt"
          class="badge badge-xs badge-primary"
        >
          {{ t("chat.has_instructions") }}
        </span>
      </div>

      <!-- Mobile Sidebar Toggle -->
      <div class="lg:hidden p-2 border-b border-base-300"></div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="displayMessages.length === 0"
          class="text-center text-base-content/50 mt-10"
        >
          {{ ct("start_prompt") }}
        </div>

        <div
          v-for="msg in displayMessages"
          :key="msg.id"
          class="chat"
          :class="msg.role === 'user' ? 'chat-end' : 'chat-start'"
        >
          <div class="chat-header capitalize text-xs opacity-50 mb-1">
            {{
              msg.role === "assistant" ? ct("header_ai") : ct("header_user")
            }}
          </div>
          <div
            class="chat-bubble"
            :class="
              msg.role === 'user'
                ? 'chat-bubble-primary'
                : 'chat-bubble-secondary'
            "
          >
            <slot name="message-extra" :message="msg" />
            <MarkdownRenderer
              v-if="msg.role === 'assistant'"
              :content="getTextContent(msg)"
            />
            <div v-else>{{ getTextContent(msg) }}</div>
          </div>
        </div>

        <!-- Tool status indicator while streaming -->
        <div v-if="activeToolStatus" class="chat chat-start">
          <div class="chat-bubble chat-bubble-ghost text-sm opacity-60">
            <span class="loading loading-dots loading-xs mr-2"></span>
            {{ ct("tool_running") }}: {{ activeToolStatus }}
          </div>
        </div>

        <!-- Loading indicator -->
        <div
          v-if="isLoading && displayMessages.length === 0"
          class="chat chat-start"
        >
          <div class="chat-bubble chat-bubble-secondary">
            <span class="loading loading-dots loading-sm"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-base-300 bg-base-100">
        <slot name="input-prepend" :is-loading="isLoading" />

        <div class="flex gap-2 max-w-4xl mx-auto">
          <slot name="toolbar-start" :is-loading="isLoading" />
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            :placeholder="ct('placeholder')"
            class="input input-bordered flex-1"
            :disabled="isLoading"
          />
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="isLoading || sendDisabled"
          >
            <slot name="send-label" :is-loading="isLoading">
              {{ ct("send") }}
            </slot>
          </button>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <ChatProjectDialog
      v-model="showProjectDialog"
      :project="editingProject"
      @save="saveProject"
    />
    <ChatMoveChatDialog
      v-model="showMoveChatDialog"
      :projects="projects"
      :current-project-id="movingChatProjectId"
      @move="handleMoveChat"
    />
  </div>
</template>
