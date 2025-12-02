<script setup lang="ts">
const props = defineProps<{
  currentContent: string;
}>();

const emit = defineEmits<{
  (
    e: "options-generated",
    data: {
      choices: { text: string; isCorrect: boolean }[];
      correctAnswer: string;
      explanation: string;
    }
  ): void;
}>();

const isOpen = ref(false);
const isGenerating = ref(false);

const generateOptions = async () => {
  if (!props.currentContent.trim()) {
    alert("Please enter problem content first.");
    return;
  }

  try {
    isGenerating.value = true;
    const data = await $fetch<{
      choices: Record<string, string>;
      correct_ans: string;
      explanation: string;
    }>("/api/teacher/generate-options", {
      method: "POST",
      body: {
        content: props.currentContent,
      },
    });

    const newChoices = Object.entries(data.choices).map(([key, text]) => ({
      text,
      isCorrect: key === data.correct_ans,
    }));

    emit("options-generated", {
      choices: newChoices,
      correctAnswer: data.correct_ans,
      explanation: data.explanation,
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    alert("Failed to generate options. Please try again.");
  } finally {
    isGenerating.value = false;
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
        <span class="icon">💡</span>
        AI Options Generator
      </span>
      <span class="text-sm opacity-70">{{ isOpen ? "Hide" : "Show" }}</span>
    </button>

    <div v-if="isOpen" class="mt-4">
      <p class="text-sm text-gray-500 mb-4">
        Use AI to automatically generate options and explanation based on the
        problem content.
      </p>

      <button
        type="button"
        @click="generateOptions"
        class="btn btn-accent w-full"
        :disabled="isGenerating || !currentContent"
      >
        <span
          v-if="isGenerating"
          class="loading loading-spinner loading-sm"
        ></span>
        {{ isGenerating ? "Generating..." : "Generate Options & Explanation" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.icon {
  font-size: 1.2em;
}
</style>
