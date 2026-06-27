<script setup lang="ts">
import type { FileUIPart, UIMessage } from "ai";

definePageMeta({
  layout: "teacher",
});

const { t } = useI18n();
const useWebSearch = ref(false);
const enabledToolkits = ref<string[]>([]);

// Image upload state
const pendingImage = ref<File | null>(null);
const pendingImagePreview = ref<string | null>(null);
const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

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

function getImageUrl(msg: UIMessage): string | null {
  const filePart = msg.parts.find(
    (p): p is import("ai").FileUIPart =>
      p.type === "file" && !!p.mediaType?.startsWith("image/")
  );
  return filePart?.url ?? null;
}

async function prepareMessage(payload: {
  text: string;
}): Promise<{ text: string; files?: FileUIPart[] } | null> {
  let text = payload.text || t("teacher.chat.image_attached");
  let files: FileUIPart[] = [];

  if (pendingImage.value) {
    isUploading.value = true;
    const uploaded = await uploadImageToR2(pendingImage.value);
    isUploading.value = false;

    if (!uploaded) {
      alert(t("teacher.chat.upload_failed"));
      return null;
    }
    files = [{ type: "file", mediaType: "image/jpeg", url: uploaded }];
    removeImage();
  }

  return { text, ...(files.length ? { files } : {}) };
}
</script>

<template>
  <ChatView
    role="teacher"
    :extra-body="() => ({ useWebSearch, toolkits: enabledToolkits })"
    :prepare-message="prepareMessage"
    :allow-empty-text="!!pendingImage"
    :send-disabled="isUploading"
  >
    <!-- Image preview above input -->
    <template #input-prepend>
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
            :title="t('teacher.chat.remove_image')"
          >
            X
          </button>
        </div>
        <span class="text-sm text-base-content/60">
          {{ t("teacher.chat.image_attached") }}
        </span>
      </div>
    </template>

    <!-- Toolbar: image upload + web search -->
    <template #toolbar-start="{ isLoading }">
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
        :title="t('teacher.chat.upload_image')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
      <button
        class="btn btn-ghost btn-square"
        :class="{ 'btn-active text-primary': useWebSearch }"
        @click="useWebSearch = !useWebSearch"
        :disabled="isLoading"
        :title="t('teacher.chat.web_search')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      </button>
    </template>

    <!-- Image display in user message bubbles -->
    <template #message-extra="{ message }">
      <img
        v-if="getImageUrl(message)"
        :src="getImageUrl(message)!"
        alt="Uploaded image"
        class="rounded-lg max-h-64 object-contain mb-2"
      />
    </template>

    <!-- Send button label override when uploading -->
    <template #send-label>
      <span v-if="isUploading">{{ t("teacher.chat.uploading") }}</span>
      <span v-else>{{ t("teacher.chat.send") }}</span>
    </template>

    <!-- Composio external tools panel -->
    <template #sidebar-bottom>
      <ChatComposioPanel role="teacher" v-model="enabledToolkits" />
    </template>
  </ChatView>
</template>
