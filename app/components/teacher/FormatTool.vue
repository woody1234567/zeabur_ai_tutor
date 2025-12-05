<script setup lang="ts">
const { t } = useI18n();
const props = defineProps<{
  currentContent: string;
}>();

const emit = defineEmits<{
  (e: "content-formatted", content: string): void;
}>();

const isOpen = ref(false);
const isProcessing = ref(false);

const formatContent = async () => {
  if (!props.currentContent.trim()) {
    alert(t("components.teacher.tools.format.alert_empty"));
    return;
  }

  try {
    isProcessing.value = true;
    const { formattedContent } = await $fetch<{ formattedContent: string }>(
      "/api/teacher/format-content",
      {
        method: "POST",
        body: {
          content: props.currentContent,
        },
      }
    );

    if (formattedContent) {
      emit("content-formatted", formattedContent);
    }
  } catch (error: any) {
    console.error("Formatting error:", error);
    alert(t("components.teacher.tools.format.alert_failed"));
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="border rounded-lg p-4 bg-base-100 shadow-sm mb-4">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="flex items-center justify-between w-full font-medium text-left"
    >
      <span class="flex items-center gap-2">
        <span class="icon">✨</span>
        {{ $t("components.teacher.tools.format.title") }}
      </span>
      <span class="text-sm opacity-70">{{
        isOpen
          ? $t("components.teacher.tools.format.hide")
          : $t("components.teacher.tools.format.show")
      }}</span>
    </button>

    <div v-if="isOpen" class="mt-4">
      <p class="text-sm text-gray-500 mb-4">
        {{ $t("components.teacher.tools.format.description") }}
        <br />
        <span class="text-xs opacity-70">
          {{ $t("components.teacher.tools.format.hint") }}
        </span>
      </p>

      <button
        type="button"
        @click="formatContent"
        class="btn btn-secondary w-full"
        :disabled="isProcessing || !currentContent"
      >
        <span
          v-if="isProcessing"
          class="loading loading-spinner loading-sm"
        ></span>
        {{
          isProcessing
            ? $t("components.teacher.tools.format.formatting")
            : $t("components.teacher.tools.format.format_button")
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.icon {
  font-size: 1.2em;
}
</style>
