<script setup lang="ts">
definePageMeta({
  layout: "student",
});

interface Project {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt?: string | null;
}

const { t } = useI18n();
const chats = ref<any[]>([]);
const currentChatId = ref<string | null>(null);
const currentProjectId = ref<string | null>(null);
const messages = ref<{ role: string; content: string; name?: string }[]>([]);
const filteredMessages = computed(() => {
  return messages.value.filter(
    (msg) =>
      msg.role === "user" ||
      (msg.role === "assistant" && msg.content) ||
      msg.role === "tool_status"
  );
});
const userMessage = ref("");
const isLoading = ref(false);
const streamingContent = ref("");
const toolStatus = ref("");
const useWebSearch = ref(false);

// Project state
const projects = ref<Project[]>([]);
const showProjectDialog = ref(false);
const editingProject = ref<Project | null>(null);
const showMoveChatDialog = ref(false);
const movingChatId = ref<string | null>(null);

const { data: chatHistoryList, refresh: refreshHistory } = await useFetch(
  "/api/student/chats"
);
const { data: projectList, refresh: refreshProjects } = await useFetch(
  "/api/student/projects"
);

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

async function loadChat(id: string) {
  currentChatId.value = id;
  const chat = chats.value.find((c) => c.id === id);
  if (chat) currentProjectId.value = chat.projectId ?? null;
  const { data: chatData } = await useFetch(`/api/student/chats/${id}`);
  if (chatData.value) {
    messages.value = chatData.value.messages as any;
  }
}

async function startNewChat(projectId?: string | null) {
  currentChatId.value = null;
  currentProjectId.value = projectId ?? null;
  messages.value = [];
}

function selectProject(projectId: string | null) {
  currentProjectId.value = projectId;
}

// Project CRUD
function openCreateProject() {
  editingProject.value = null;
  showProjectDialog.value = true;
}

function openEditProject(project: Project) {
  editingProject.value = project;
  showProjectDialog.value = true;
}

async function saveProject(data: { name: string; description: string; systemPrompt: string }) {
  if (editingProject.value) {
    await $fetch(`/api/student/projects/${editingProject.value.id}`, {
      method: "PUT",
      body: data,
    });
  } else {
    await $fetch("/api/student/projects", {
      method: "POST",
      body: data,
    });
  }
  await refreshProjects();
}

async function handleDeleteProject(id: string) {
  if (!confirm(t("chat.confirm_delete_project"))) return;
  await $fetch(`/api/student/projects/${id}`, { method: "DELETE" });
  if (currentProjectId.value === id) currentProjectId.value = null;
  await Promise.all([refreshProjects(), refreshHistory()]);
}

// Move chat
function openMoveChat(chatId: string) {
  movingChatId.value = chatId;
  showMoveChatDialog.value = true;
}

async function handleMoveChat(projectId: string | null) {
  if (!movingChatId.value) return;
  await $fetch(`/api/student/chats/${movingChatId.value}/project`, {
    method: "PUT",
    body: { projectId },
  });
  await refreshHistory();
}

const currentProject = computed(() =>
  projects.value.find((p) => p.id === currentProjectId.value)
);

const movingChatProjectId = computed(() => {
  const chat = chats.value.find((c) => c.id === movingChatId.value);
  return chat?.projectId ?? null;
});

async function sendMessage() {
  if (!userMessage.value.trim() || isLoading.value) return;

  const msg = userMessage.value;
  userMessage.value = "";
  isLoading.value = true;
  streamingContent.value = "";
  toolStatus.value = "";

  messages.value.push({ role: "user", content: msg });

  const aiMsgIndex = messages.value.length;
  messages.value.push({ role: "assistant", content: "" });

  try {
    const res = await fetch("/api/student/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        chatId: currentChatId.value,
        projectId: currentProjectId.value,
        useWebSearch: useWebSearch.value,
      }),
    });

    if (!res.ok || !res.body) {
      messages.value[aiMsgIndex].content = t("student.chat.error_response");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === "token") {
            messages.value[aiMsgIndex].content += data.content;
          } else if (data.type === "tool_start") {
            toolStatus.value = `${t("student.chat.tool_running")}: ${data.tool}`;
          } else if (data.type === "tool_result") {
            toolStatus.value = "";
          } else if (data.type === "done") {
            messages.value[aiMsgIndex].content = data.content;
            toolStatus.value = "";
          } else if (data.type === "chat_id") {
            currentChatId.value = data.chatId;
            await refreshHistory();
          }
        } catch {
          // ignore malformed events
        }
      }
    }
  } catch (e) {
    console.error(e);
    messages.value[aiMsgIndex].content = t("student.chat.error_response");
  } finally {
    isLoading.value = false;
    toolStatus.value = "";
  }
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex">
    <!-- Sidebar -->
    <ChatProjectSidebar
      :projects="projects"
      :chats="chats"
      :current-chat-id="currentChatId"
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
      <div v-if="currentProject" class="px-4 py-2 border-b border-base-300 bg-base-200/50 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="text-sm font-medium">{{ currentProject.name }}</span>
        <span v-if="currentProject.systemPrompt" class="badge badge-xs badge-primary">
          {{ t("chat.has_instructions") }}
        </span>
      </div>

      <!-- Mobile Sidebar Toggle -->
      <div class="lg:hidden p-2 border-b border-base-300"></div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="filteredMessages.length === 0"
          class="text-center text-base-content/50 mt-10"
        >
          {{ $t("student.chat.start_prompt") }}
        </div>

        <div
          v-for="(msg, index) in filteredMessages"
          :key="index"
          class="chat"
          :class="msg.role === 'user' ? 'chat-end' : 'chat-start'"
        >
          <div class="chat-header capitalize text-xs opacity-50 mb-1">
            {{
              msg.role === "assistant"
                ? $t("student.chat.header_ai")
                : $t("student.chat.header_user")
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
            <MarkdownRenderer
              v-if="msg.role === 'assistant'"
              :content="msg.content"
            />
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>

        <!-- Tool status indicator while streaming -->
        <div v-if="toolStatus" class="chat chat-start">
          <div class="chat-bubble chat-bubble-ghost text-sm opacity-60">
            <span class="loading loading-dots loading-xs mr-2"></span>
            {{ toolStatus }}
          </div>
        </div>

        <!-- Loading indicator (before first token arrives) -->
        <div v-if="isLoading && !messages.some(m => m.role === 'assistant' && m.content)" class="chat chat-start">
          <div class="chat-bubble chat-bubble-secondary">
            <span class="loading loading-dots loading-sm"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-base-300 bg-base-100">
        <div class="flex gap-2 max-w-4xl mx-auto">
          <button
            class="btn btn-ghost btn-square"
            :class="{ 'btn-active text-primary': useWebSearch }"
            @click="useWebSearch = !useWebSearch"
            :disabled="isLoading"
            :title="$t('student.chat.web_search')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </button>
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            :placeholder="$t('student.chat.placeholder')"
            class="input input-bordered flex-1"
            :disabled="isLoading"
          />
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="isLoading"
          >
            {{ $t("student.chat.send") }}
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
