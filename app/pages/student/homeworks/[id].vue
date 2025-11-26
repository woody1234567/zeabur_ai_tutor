<script setup lang="ts">
import type { homeworks, problems } from "~~/db/schema";

definePageMeta({
  layout: "student",
});

const route = useRoute();
const homeworkId = route.params.id as string;

type HomeworkDetail = {
  homework: typeof homeworks.$inferSelect;
  problems: (typeof problems.$inferSelect)[];
};

// Fetch homework data
const { data, status, error } = await useFetch<HomeworkDetail>(
  `/api/student/homeworks/${homeworkId}`
);

// State
const started = ref(false);
const currentProblemIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const isSubmitting = ref(false);
const submissionResult = ref<{
  correct: boolean;
  explanation: string | null;
  correctAnswer: string;
} | null>(null);

const currentProblem = computed(() => {
  if (!data.value || !data.value.problems) return null;
  return data.value.problems[currentProblemIndex.value];
});

const isLastProblem = computed(() => {
  if (!data.value || !data.value.problems) return false;
  return currentProblemIndex.value === data.value.problems.length - 1;
});

// Reset state when changing problems
watch(currentProblemIndex, () => {
  selectedAnswer.value = null;
  submissionResult.value = null;
});

const startHomework = () => {
  started.value = true;
};

const submitAnswer = async () => {
  if (!selectedAnswer.value || !currentProblem.value) return;

  isSubmitting.value = true;
  try {
    const result = await $fetch("/api/submissions", {
      method: "POST",
      body: {
        problemId: currentProblem.value.id,
        userAnswer: selectedAnswer.value,
      },
    });
    submissionResult.value = result;
  } catch (e) {
    console.error("Submission failed", e);
  } finally {
    isSubmitting.value = false;
  }
};

const nextProblem = () => {
  if (!data.value || !data.value.problems) return;
  if (currentProblemIndex.value < data.value.problems.length - 1) {
    currentProblemIndex.value++;
  }
};

const finishHomework = async () => {
  await navigateTo("/student/homeworks");
};
</script>

<template>
  <div class="container mx-auto max-w-3xl pb-20 p-4">
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error">
      <span>Error loading homework: {{ error.message }}</span>
    </div>

    <!-- Start Screen -->
    <div v-else-if="!started && data" class="card bg-base-100 shadow-xl mt-10">
      <div class="card-body text-center">
        <h1 class="text-4xl font-bold mb-4">{{ data.homework.title }}</h1>
        <p class="text-xl mb-6">Subject: {{ data.homework.subject }}</p>
        <div class="stats shadow mb-8">
          <div class="stat">
            <div class="stat-title">Questions</div>
            <div class="stat-value">{{ data.problems.length }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Deadline</div>
            <div class="stat-value text-lg">
              {{
                data.homework.deadline
                  ? new Date(data.homework.deadline).toLocaleDateString()
                  : "None"
              }}
            </div>
          </div>
        </div>
        <div class="card-actions justify-center">
          <button @click="startHomework" class="btn btn-primary btn-lg">
            Start Homework
          </button>
        </div>
      </div>
    </div>

    <!-- Problem View -->
    <div v-else-if="currentProblem" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div class="text-sm breadcrumbs">
          <ul>
            <li><NuxtLink to="/student/homeworks">Homeworks</NuxtLink></li>
            <li>{{ data?.homework.title }}</li>
          </ul>
        </div>
        <div class="badge badge-lg">
          Question {{ currentProblemIndex + 1 }} / {{ data?.problems.length }}
        </div>
      </div>

      <!-- Problem Card -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">{{ currentProblem.title }}</h2>
          <MarkdownRenderer
            :content="currentProblem.content"
            class="py-4 text-lg"
          />

          <!-- Image -->
          <div v-if="currentProblem.imageUrl" class="my-4 flex justify-center">
            <img
              :src="currentProblem.imageUrl"
              alt="Problem Image"
              class="max-h-96 rounded-lg shadow-md object-contain"
            />
          </div>

          <div class="divider"></div>

          <!-- Choices -->
          <div class="form-control space-y-3">
            <label
              v-for="(text, key) in currentProblem.choices"
              :key="key"
              class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
              :class="{
                'border-primary bg-primary/10': selectedAnswer === key,
                'border-success bg-success/10':
                  submissionResult && key === submissionResult.correctAnswer,
                'border-error bg-error/10':
                  submissionResult &&
                  !submissionResult.correct &&
                  key === selectedAnswer,
              }"
            >
              <span class="label-text text-base flex-1">
                <span class="font-bold mr-2">{{ key }}.</span> {{ text }}
              </span>
              <input
                type="radio"
                name="choices"
                class="radio radio-primary"
                :value="key"
                v-model="selectedAnswer"
                :disabled="!!submissionResult"
              />
            </label>
          </div>

          <!-- Actions -->
          <div class="card-actions justify-end mt-6 flex gap-2">
            <!-- Submit Answer Button -->
            <button
              v-if="!submissionResult"
              class="btn btn-primary"
              @click="submitAnswer"
              :disabled="!selectedAnswer || isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              Submit Answer
            </button>

            <!-- Next / Finish Buttons (Only show after submission) -->
            <template v-else>
              <button
                v-if="!isLastProblem"
                class="btn btn-outline"
                @click="nextProblem"
              >
                Next Question
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button v-else class="btn btn-success" @click="finishHomework">
                Finish Homework
              </button>
            </template>
          </div>

          <!-- Result Feedback -->
          <div v-if="submissionResult" class="mt-4 animate-fade-in">
            <div
              class="alert"
              :class="
                submissionResult.correct ? 'alert-success' : 'alert-error'
              "
            >
              <span>{{
                submissionResult.correct
                  ? "Correct!"
                  : "Incorrect. The correct answer is " +
                    submissionResult.correctAnswer
              }}</span>
            </div>
            <div
              v-if="submissionResult.explanation"
              class="mt-4 p-4 bg-base-200 rounded-lg"
            >
              <h3 class="font-bold mb-2">Explanation:</h3>
              <MarkdownRenderer :content="submissionResult.explanation" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
