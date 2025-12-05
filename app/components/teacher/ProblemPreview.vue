<script setup lang="ts">
interface ProblemData {
  title: string;
  content: string;
  choices: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  source: string;
  imagePreviewUrl: string | null;
}

defineProps<{
  problem: ProblemData;
}>();
</script>

<template>
  <div class="sticky top-4">
    <h2 class="text-xl font-bold mb-4 text-base-content/70">
      {{ $t("teacher.problems.preview.title") }}
    </h2>

    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h1 class="card-title text-2xl">
            {{ problem.title || $t("teacher.problems.preview.default_title") }}
          </h1>
          <div class="flex gap-2">
            <div class="badge badge-outline">{{ problem.difficulty }}</div>
          </div>
        </div>
        <div v-if="problem.source" class="badge badge-ghost">
          <span class="badge badge-outline">{{
            $t("teacher.problems.preview.source")
          }}</span>
          {{ problem.source }}
        </div>

        <!-- Problem Content -->
        <div class="py-4">
          <MarkdownRenderer
            :content="
              problem.content || $t('teacher.problems.preview.default_content')
            "
          />
        </div>

        <!-- Image Preview -->
        <div v-if="problem.imagePreviewUrl" class="mb-4">
          <img
            :src="problem.imagePreviewUrl"
            alt="Problem Image"
            class="rounded-lg max-h-96 object-contain"
          />
        </div>

        <div class="divider"></div>

        <!-- Choices Preview -->
        <div class="form-control space-y-3">
          <label
            v-for="(choice, index) in problem.choices"
            :key="index"
            class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
            :class="{
              'border-success bg-success/10':
                choice.text && choice.text === problem.correctAnswer,
            }"
          >
            <span class="label-text text-base flex-1 flex items-start">
              <span class="font-bold mr-2 mt-1"
                >{{ String.fromCharCode(65 + index) }}.</span
              >
              <MarkdownRenderer
                :content="
                  choice.text ||
                  $t('teacher.problems.preview.default_choice') + (index + 1)
                "
              />
            </span>
            <input
              type="radio"
              name="preview-radio"
              class="radio radio-primary"
              :checked="choice.text === problem.correctAnswer"
              disabled
            />
          </label>
        </div>

        <!-- Explanation Preview -->
        <div v-if="problem.explanation" class="mt-6">
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" checked />
            <div class="collapse-title text-xl font-medium">
              {{ $t("teacher.problems.preview.solution") }}
            </div>
            <div class="collapse-content">
              <MarkdownRenderer :content="problem.explanation" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
