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
import GenerateOptionsTool from "./GenerateOptionsTool.vue";

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

const handleOptionsGenerated = (data: {
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
}) => {
  emit("update:modelValue", {
    ...props.modelValue,
    choices: data.choices,
    correctAnswer: data.correctAnswer,
    explanation: data.explanation,
  });
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
    alert(useNuxtApp().$i18n.t("teacher.problems.form.validation.title"));
    return false;
  }
  if (!props.modelValue.content.trim()) {
    alert(useNuxtApp().$i18n.t("teacher.problems.form.validation.content"));
    return false;
  }
  if (props.modelValue.choices.length < 2) {
    alert(useNuxtApp().$i18n.t("teacher.problems.form.validation.min_choices"));
    return false;
  }
  if (props.modelValue.choices.some((c) => !c.text.trim())) {
    alert(useNuxtApp().$i18n.t("teacher.problems.form.validation.choice_text"));
    return false;
  }
  if (!props.modelValue.correctAnswer) {
    alert(
      useNuxtApp().$i18n.t("teacher.problems.form.validation.correct_answer")
    );
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
        <label class="label">{{
          $t("teacher.problems.form.difficulty")
        }}</label>
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
          <option value="easy">
            {{ $t("teacher.problems.form.difficulty_options.easy") }}
          </option>
          <option value="medium">
            {{ $t("teacher.problems.form.difficulty_options.medium") }}
          </option>
          <option value="hard">
            {{ $t("teacher.problems.form.difficulty_options.hard") }}
          </option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">{{ $t("teacher.problems.form.source") }}</label>
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
        <label class="label mb-2">{{
          $t("teacher.problems.form.title")
        }}</label>
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
        <label class="label mb-2">{{
          $t("teacher.problems.form.hashtags")
        }}</label>
        <div class="flex gap-2 mb-2">
          <input
            v-model="newHashtag"
            @keydown.enter.prevent="addHashtag"
            type="text"
            class="input input-bordered flex-1"
            :placeholder="$t('teacher.problems.form.hashtag_placeholder')"
          />
          <button
            type="button"
            @click="addHashtag"
            class="btn btn-secondary p-2"
          >
            {{ $t("teacher.problems.form.add_hashtag") }}
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
      <label class="label mb-2">{{
        $t("teacher.problems.form.content")
      }}</label>
      <VisionTool @text-extracted="handleTextExtracted" />
      <div class="flex gap-2 mb-2">
        <FormatTool
          :current-content="modelValue.content"
          @content-formatted="handleContentFormatted"
          class="flex-1"
        />
        <GenerateOptionsTool
          :current-content="modelValue.content"
          @options-generated="handleOptionsGenerated"
          class="flex-1"
        />
      </div>
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
      <label class="label mb-2">{{ $t("teacher.problems.form.image") }}</label>
      <br />
      <input
        type="file"
        @change="handleImageUpload"
        accept="image/*"
        class="file-input file-input-bordered"
      />
    </div>

    <div class="form-control">
      <label class="label mb-2">{{
        $t("teacher.problems.form.choices")
      }}</label>
      <div
        v-for="(choice, index) in modelValue.choices"
        :key="index"
        class="flex gap-2 mb-2 items-start"
      >
        <div class="pt-3 font-bold w-6">
          {{ String.fromCharCode(65 + index) }}.
        </div>
        <input
          :value="choice.text"
          @input="
            updateChoiceText(index, ($event.target as HTMLInputElement).value)
          "
          type="text"
          class="input input-bordered flex-1"
          :placeholder="$t('teacher.problems.form.choice_placeholder')"
          required
        />
        <input
          type="radio"
          name="correctAnswer"
          :value="String.fromCharCode(65 + index)"
          :checked="
            modelValue.correctAnswer === String.fromCharCode(65 + index)
          "
          @change="
            updateField('correctAnswer', String.fromCharCode(65 + index))
          "
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
        {{ $t("teacher.problems.form.add_choice") }}
      </button>
    </div>

    <div class="form-control">
      <label class="label mb-2">{{
        $t("teacher.problems.form.explanation")
      }}</label>
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
        {{ isUploading ? $t("teacher.problems.form.uploading") : submitLabel }}
      </button>
      <button type="button" @click="$emit('cancel')" class="btn btn-ghost">
        {{ $t("teacher.problems.form.cancel") }}
      </button>
    </div>
  </form>
</template>
