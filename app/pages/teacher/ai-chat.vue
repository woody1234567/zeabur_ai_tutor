<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

interface ChatMessage {
  role: string;
  content: string;
  imageUrl?: string;
  name?: string;
}

const { t } = useI18n();
const chats = ref([]);
const currentChatId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
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

const pendingImage = ref<File | null>(null);
const pendingImagePreview = ref<string | null>(null);
const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const { data: chatHistoryList, refresh: refreshHistory } = await useFetch(
  "/api/teacher/chats"
);

watch(
  chatHistoryList,
  (newList) => {
    if (newList) {
      chats.value = newList;
    }
  },
  { immediate: true }
);

async function loadChat(id: string) {
  currentChatId.value = id;
  const { data: chatData } = await useFetch(`/api/teacher/chats/${id}`);
  if (chatData.value) {
    messages.value = chatData.value.messages as any;
  }
}

async function startNewChat() {
  currentChatId.value = null;
  messages.value = [];
}

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
  isLoading.value = true;
  streamingContent.value = "";
  toolStatus.value = "";

  let imageUrl: string | undefined;

  if (pendingImage.value) {
    isUploading.value = true;
    const uploaded = await uploadImageToR2(pendingImage.value);
    isUploading.value = false;

    if (!uploaded) {
      alert(t("teacher.chat.upload_failed"));
      isLoading.value = false;
      return;
    }
    imageUrl = uploaded;
    removeImage();
  }

  messages.value.push({ role: "user", content: msg, ...(imageUrl && { imageUrl }) });

  const aiMsgIndex = messages.value.length;
  messages.value.push({ role: "assistant", content: "" });

  try {
    const res = await fetch("/api/teacher/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        chatId: currentChatId.value,
        ...(imageUrl && { imageUrl }),
      }),
    });

    if (!res.ok || !res.body) {
      messages.value[aiMsgIndex].content = t("teacher.chat.error_response");
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
            toolStatus.value = `${t("teacher.chat.tool_running")}: ${data.tool}`;
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
    messages.value[aiMsgIndex].content = t("teacher.chat.error_response");
  } finally {
    isLoading.value = false;
    toolStatus.value = "";
  }
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex">
    <!-- Sidebar -->
    <div
      class="w-64 bg-base-200 p-4 border-r border-base-300 flex flex-col hidden lg:flex"
    >
      <button class="btn btn-primary w-full mb-4" @click="startNewChat">
        + {{ $t("teacher.chat.new_chat") }}
      </button>
      <div class="flex-1 overflow-y-auto space-y-2">
        <div
          v-for="chat in chats"
          :key="chat.id"
          class="p-3 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
          :class="{ 'bg-base-300': currentChatId === chat.id }"
          @click="loadChat(chat.id)"
        >
          <div class="text-sm font-medium truncate">
            {{ chat.title || $t("teacher.chat.new_chat") }}
          </div>
          <div class="text-xs text-base-content/60">
            {{ new Date(chat.updatedAt).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col bg-base-100">
      <!-- Mobile Sidebar Toggle -->
      <div class="lg:hidden p-2 border-b border-base-300"></div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="filteredMessages.length === 0"
          class="text-center text-base-content/50 mt-10"
        >
          {{ $t("teacher.chat.start_prompt") }}
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
              v-if="msg.imageUrl"
              :src="msg.imageUrl"
              alt="Uploaded image"
              class="rounded-lg max-h-64 object-contain mb-2"
            />
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
        <div
          v-if="isLoading && !messages.some((m) => m.role === 'assistant' && m.content)"
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
  </div>
</template>
