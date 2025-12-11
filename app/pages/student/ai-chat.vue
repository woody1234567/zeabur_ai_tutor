<script setup lang="ts">
definePageMeta({
  layout: "student",
});

const { t } = useI18n();
const chats = ref([]);
const currentChatId = ref<string | null>(null);
const messages = ref<{ role: string; content: string }[]>([]);
const filteredMessages = computed(() => {
  return messages.value.filter(
    (msg) =>
      msg.role === "user" ||
      msg.role === "assistant" ||
      (msg.role === "tool" &&
        ((msg as any).name === "search_problems" ||
          (msg as any).name === "recommend_materials"))
  );
});
const userMessage = ref("");
const isLoading = ref(false);

const { data: chatHistoryList, refresh: refreshHistory } = await useFetch(
  "/api/student/chats"
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
  const { data: chatData } = await useFetch(`/api/student/chats/${id}`);
  if (chatData.value) {
    messages.value = chatData.value.messages as any;
  }
}

async function startNewChat() {
  currentChatId.value = null;
  messages.value = [];
}

async function sendMessage() {
  if (!userMessage.value.trim() || isLoading.value) return;

  const msg = userMessage.value;
  userMessage.value = "";
  messages.value.push({ role: "user", content: msg });
  isLoading.value = true;

  try {
    const { data, error } = await useFetch("/api/student/chat", {
      method: "POST",
      body: {
        message: msg,
        chatId: currentChatId.value,
      },
    });

    if (error.value) {
      console.error(error.value);
      messages.value.push({
        role: "assistant",
        content: "Sorry, checking error...",
      });
    } else if (data.value) {
      currentChatId.value = data.value.chatId;
      messages.value = data.value.messages;
      refreshHistory();
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
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
        + New Chat
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
            {{ chat.title || "New Chat" }}
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
      <div class="lg:hidden p-2 border-b border-base-300">
        <!-- You might want a drawer toggle here for mobile -->
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="filteredMessages.length === 0"
          class="text-center text-base-content/50 mt-10"
        >
          Start a conversation with your AI Tutor!
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
                ? "AI Tutor"
                : msg.role === "tool"
                ? "Recommended Problems"
                : "You"
            }}
          </div>
          <div
            class="chat-bubble"
            :class="
              msg.role === 'user'
                ? 'chat-bubble-primary'
                : msg.role === 'tool'
                ? 'bg-transparent text-base-content p-0 shadow-none'
                : 'chat-bubble-secondary'
            "
          >
            <!-- Assistant Message -->
            <MarkdownRenderer
              v-if="msg.role === 'assistant'"
              :content="msg.content"
            />

            <!-- Tool Output (Problem Cards) -->
            <div
              v-else-if="msg.role === 'tool' && (msg as any).name === 'search_problems'"
              class="grid grid-cols-1 gap-2"
            >
              <ProblemCard
                v-for="problem in JSON.parse(msg.content)"
                :key="problem.id"
                :problem="problem"
              />
            </div>

            <!-- Tool Output (Material Cards) -->
            <div
              v-else-if="msg.role === 'tool' && (msg as any).name === 'recommend_materials'"
              class="grid grid-cols-1 gap-2"
            >
              <div
                v-if="JSON.parse(msg.content).length === 0"
                class="text-sm opacity-60"
              >
                No materials found.
              </div>
              <ClassMaterialCard
                v-for="material in JSON.parse(msg.content)"
                :key="material.id"
                :material="material"
              />
            </div>

            <!-- User Message -->
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="chat chat-start">
          <div class="chat-bubble chat-bubble-secondary">
            <span class="loading loading-dots loading-sm"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-base-300 bg-base-100">
        <div class="flex gap-2 max-w-4xl mx-auto">
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Type your message..."
            class="input input-bordered flex-1"
            :disabled="isLoading"
          />
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="isLoading"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
