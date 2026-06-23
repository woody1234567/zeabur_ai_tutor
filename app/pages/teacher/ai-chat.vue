<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport, isToolUIPart } from "ai";
import type { UIMessage, FileUIPart } from "ai";

definePageMeta({
  layout: "teacher",
});

interface Project {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt?: string | null;
}

const { t } = useI18n();
const chatId = ref(crypto.randomUUID());
const currentProjectId = ref<string | null>(null);
const useWebSearch = ref(false);
const userMessage = ref("");

const pendingImage = ref<File | null>(null);
const pendingImagePreview = ref<string | null>(null);
const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const projects = ref<Project[]>([]);
const showProjectDialog = ref(false);
const editingProject = ref<Project | null>(null);
const showMoveChatDialog = ref(false);
const movingChatId = ref<string | null>(null);

const { data: chatHistoryList, refresh: refreshHistory } = await useFetch(
  "/api/teacher/chats"
);
const { data: projectList, refresh: refreshProjects } = await useFetch(
  "/api/teacher/projects"
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
    api: "/api/teacher/chat",
    body: () => ({
      chatId: chatId.value,
      projectId: currentProjectId.value,
      useWebSearch: useWebSearch.value,
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

function getImageUrl(msg: UIMessage): string | null {
  const filePart = msg.parts.find(
    (p): p is FileUIPart => p.type === "file" && !!p.mediaType?.startsWith("image/")
  );
  return filePart?.url ?? null;
}

function getActiveToolName(msg: UIMessage): string | null {
  for (const part of msg.parts) {
    if (isToolUIPart(part) && "state" in part) {
      if (part.state !== "output-available" && part.state !== "output-error") {
        return "toolName" in part ? (part as any).toolName : part.type.replace(/^tool-/, "");
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
  const { data } = await useFetch(`/api/teacher/chats/${id}`);
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

async function saveProject(data: { name: string; description: string; systemPrompt: string }) {
  if (editingProject.value) {
    await $fetch(`/api/teacher/projects/${editingProject.value.id}`, {
      method: "PUT",
      body: data,
    });
  } else {
    await $fetch("/api/teacher/projects", {
      method: "POST",
      body: data,
    });
  }
  await refreshProjects();
}

async function handleDeleteProject(id: string) {
  if (!confirm(t("chat.confirm_delete_project"))) return;
  await $fetch(`/api/teacher/projects/${id}`, { method: "DELETE" });
  if (currentProjectId.value === id) currentProjectId.value = null;
  await Promise.all([refreshProjects(), refreshHistory()]);
}

function openMoveChat(chatMoveId: string) {
  movingChatId.value = chatMoveId;
  showMoveChatDialog.value = true;
}

async function handleMoveChat(projectId: string | null) {
  if (!movingChatId.value) return;
  await $fetch(`/api/teacher/chats/${movingChatId.value}/project`, {
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

// Image handling
function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > MAX_IMAGE_SIZE) {
    alert(t("teacher.chat.image_too_large"));
    input.value = "";
    return;
  }

  pendingImage.value = file;
  pendingImagePreview.value = URL.createObjectURL(file);
  input.value = "";
}

function removeImage() {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value);
  }
  pendingImage.value = null;
  pendingImagePreview.value = null;
}

async function uploadImageToR2(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await $fetch<{ imageUrl: string }>("/api/teacher/upload", {
      method: "POST",
      body: formData,
    });
    return res.imageUrl;
  } catch (e) {
    console.error("Image upload failed:", e);
    return null;
  }
}

async function sendMessage() {
  if ((!userMessage.value.trim() && !pendingImage.value) || isLoading.value) return;

  const msg = userMessage.value || t("teacher.chat.image_attached");
  userMessage.value = "";

  let imageUrl: string | undefined;

  if (pendingImage.value) {
    isUploading.value = true;
    const uploaded = await uploadImageToR2(pendingImage.value);
    isUploading.value = false;

    if (!uploaded) {
      alert(t("teacher.chat.upload_failed"));
      return;
    }
    imageUrl = uploaded;
    removeImage();
  }

  const fileParts: FileUIPart[] = imageUrl
    ? [{ type: "file", mediaType: "image/jpeg", url: imageUrl }]
    : [];

  await chat.sendMessage({
    text: msg,
    files: fileParts,
  });
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
          v-if="displayMessages.length === 0"
          class="text-center text-base-content/50 mt-10"
        >
          {{ $t("teacher.chat.start_prompt") }}
        </div>

        <div
          v-for="msg in displayMessages"
          :key="msg.id"
          class="chat"
          :class="msg.role === 'user' ? 'chat-end' : 'chat-start'"
        >
          <div class="chat-header capitalize text-xs opacity-50 mb-1">
            {{
              msg.role === "assistant"
                ? $t("teacher.chat.header_ai")
                : $t("teacher.chat.header_user")
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
            <img
              v-if="getImageUrl(msg)"
              :src="getImageUrl(msg)!"
              alt="Uploaded image"
              class="rounded-lg max-h-64 object-contain mb-2"
            />
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
            {{ $t("teacher.chat.tool_running") }}: {{ activeToolStatus }}
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
        <!-- Image Preview -->
        <div
          v-if="pendingImagePreview"
          class="max-w-4xl mx-auto mb-2 flex items-center gap-2"
        >
          <div class="relative inline-block">
            <img
              :src="pendingImagePreview"
              alt="Preview"
              class="rounded-lg max-h-32 object-contain border border-base-300"
            />
            <button
              class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
              @click="removeImage"
              :title="$t('teacher.chat.remove_image')"
            >
              X
            </button>
          </div>
          <span class="text-sm text-base-content/60">
            {{ $t("teacher.chat.image_attached") }}
          </span>
        </div>

        <div class="flex gap-2 max-w-4xl mx-auto">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            class="hidden"
            @change="onFileSelect"
          />
          <button
            class="btn btn-ghost btn-square"
            @click="fileInputRef?.click()"
            :disabled="isLoading"
            :title="$t('teacher.chat.upload_image')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            class="btn btn-ghost btn-square"
            :class="{ 'btn-active text-primary': useWebSearch }"
            @click="useWebSearch = !useWebSearch"
            :disabled="isLoading"
            :title="$t('teacher.chat.web_search')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </button>
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            :placeholder="$t('teacher.chat.placeholder')"
            class="input input-bordered flex-1"
            :disabled="isLoading"
          />
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="isLoading || isUploading"
          >
            <span v-if="isUploading">{{ $t("teacher.chat.uploading") }}</span>
            <span v-else>{{ $t("teacher.chat.send") }}</span>
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
