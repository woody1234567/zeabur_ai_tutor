<script setup lang="ts">
interface Choice {
  text: string;
  isCorrect: boolean;
}

interface ProblemData {
  title: string;
  content: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  source: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  hashtags: string[];
}

import VisionTool from "./VisionTool.vue";
import FormatTool from "./FormatTool.vue";

const props = defineProps<{
  modelValue: ProblemData;
  isUploading: boolean;
  submitLabel: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ProblemData): void;
  (e: "submit"): void;
  (e: "cancel"): void;
}>();

const newHashtag = ref("");

// Helper to update nested properties
const updateField = <K extends keyof ProblemData>(
  field: K,
  value: ProblemData[K]
) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const handleTextExtracted = (text: string) => {
  const currentContent = props.modelValue.content;
  const newContent = currentContent ? `${currentContent}\n\n${text}` : text;
  updateField("content", newContent);
};

const handleContentFormatted = (formattedContent: string) => {
  updateField("content", formattedContent);
};

const addChoice = () => {
  const newChoices = [
    ...props.modelValue.choices,
    { text: "", isCorrect: false },
  ];
  updateField("choices", newChoices);
};

const removeChoice = (index: number) => {
  const newChoices = [...props.modelValue.choices];
  newChoices.splice(index, 1);
  updateField("choices", newChoices);
};

const updateChoiceText = (index: number, text: string) => {
  const newChoices = [...props.modelValue.choices];
  newChoices[index] = {
    text,
    isCorrect: newChoices[index]!.isCorrect,
  };
  updateField("choices", newChoices);
};

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];

    // Create preview URL
    if (
      props.modelValue.imagePreviewUrl &&
      !props.modelValue.imagePreviewUrl.startsWith("http")
    ) {
      URL.revokeObjectURL(props.modelValue.imagePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);

    emit("update:modelValue", {
      ...props.modelValue,
      imageFile: file,
      imagePreviewUrl: previewUrl,
    });
  }
};

const addHashtag = () => {
  const tag = newHashtag.value.trim();
  if (tag && !props.modelValue.hashtags.includes(tag)) {
    const newHashtags = [...props.modelValue.hashtags, tag];
    updateField("hashtags", newHashtags);
    newHashtag.value = "";
  }
};

const removeHashtag = (index: number) => {
  const newHashtags = [...props.modelValue.hashtags];
  newHashtags.splice(index, 1);
  updateField("hashtags", newHashtags);
};

const validateForm = () => {
  if (!props.modelValue.title.trim()) {
    alert("Please enter a title");
    return false;
  }
  if (!props.modelValue.content.trim()) {
    alert("Please enter problem content");
    return false;
  }
  if (props.modelValue.choices.length < 2) {
    alert("Please add at least 2 choices");
    return false;
  }
  if (props.modelValue.choices.some((c) => !c.text.trim())) {
    alert("Please fill in all choice texts");
    return false;
  }
  if (!props.modelValue.correctAnswer) {
    alert("Please select a correct answer");
    return false;
  }
  return true;
};

const handleSubmit = () => {
  if (validateForm()) {
    emit("submit");
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Difficulty</label>
        <select
          :value="modelValue.difficulty"
          @input="
            updateField(
              'difficulty',
              ($event.target as HTMLSelectElement).value as any
            )
          "
          class="select select-bordered"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">Source</label>
        <input
          :value="modelValue.source"
          @input="
            updateField('source', ($event.target as HTMLInputElement).value)
          "
          type="text"
          class="input input-bordered"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label mb-2">Title</label>
        <br />
        <input
          :value="modelValue.title"
          @input="
            updateField('title', ($event.target as HTMLInputElement).value)
          "
          type="text"
          class="input input-bordered"
          required
        />
      </div>
      <div class="form-control">
        <label class="label mb-2">Hashtags</label>
        <div class="flex gap-2 mb-2">
          <input
            v-model="newHashtag"
            @keydown.enter.prevent="addHashtag"
            type="text"
            class="input input-bordered flex-1"
            placeholder="Type a tag and press Enter"
          />
          <button
            type="button"
            @click="addHashtag"
            class="btn btn-secondary p-2"
          >
            Add
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(tag, index) in modelValue.hashtags"
            :key="index"
            class="badge badge-lg badge-primary gap-2"
          >
            {{ tag }}
            <button
              type="button"
              @click="removeHashtag(index)"
              class="btn btn-xs btn-circle btn-ghost"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="form-control">
      <label class="label mb-2">Content (Markdown supported)</label>
      <VisionTool @text-extracted="handleTextExtracted" />
      <FormatTool
        :current-content="modelValue.content"
        @content-formatted="handleContentFormatted"
      />
      <br />
      <textarea
        :value="modelValue.content"
        @input="
          updateField('content', ($event.target as HTMLTextAreaElement).value)
        "
        class="textarea textarea-bordered overflow-hidden h-64 w-full font-mono"
        required
      ></textarea>
    </div>

    <div class="form-control">
      <label class="label mb-2">Image (Optional)</label>
      <br />
      <input
        type="file"
        @change="handleImageUpload"
        accept="image/*"
        class="file-input file-input-bordered"
      />
    </div>

    <div class="form-control">
      <label class="label mb-2">Choices</label>
      <div
        v-for="(choice, index) in modelValue.choices"
        :key="index"
        class="flex gap-2 mb-2"
      >
        <input
          :value="choice.text"
          @input="
            updateChoiceText(index, ($event.target as HTMLInputElement).value)
          "
          type="text"
          class="input input-bordered flex-1"
          placeholder="Choice text"
          required
        />
        <input
          type="radio"
          name="correctAnswer"
          :value="choice.text"
          :checked="modelValue.correctAnswer === choice.text"
          @change="updateField('correctAnswer', choice.text)"
          class="radio radio-primary mt-3"
          required
        />
        <button
          type="button"
          @click="removeChoice(index)"
          class="btn btn-square btn-error btn-sm mt-1"
        >
          ✕
        </button>
      </div>
      <button type="button" @click="addChoice" class="btn btn-sm btn-ghost">
        + Add Choice
      </button>
    </div>

    <div class="form-control">
      <label class="label mb-2">Explanation</label>
      <br />
      <textarea
        :value="modelValue.explanation"
        @input="
          updateField(
            'explanation',
            ($event.target as HTMLTextAreaElement).value
          )
        "
        class="textarea textarea-bordered overflow-hidden h-64 w-full font-mono"
      ></textarea>
    </div>

    <div class="flex gap-4">
      <button
        type="submit"
        class="btn btn-primary flex-1"
        :disabled="isUploading"
      >
        {{ isUploading ? "Uploading..." : submitLabel }}
      </button>
      <button type="button" @click="$emit('cancel')" class="btn btn-ghost">
        Cancel
      </button>
    </div>
  </form>
</template>
