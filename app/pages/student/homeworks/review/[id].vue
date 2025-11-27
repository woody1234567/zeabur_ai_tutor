<script setup lang="ts">
import type { homeworks, problems } from "~~/db/schema";

definePageMeta({
  layout: "student",
});

const route = useRoute();
const homeworkId = route.params.id as string;

type HomeworkReviewDetail = {
  homework: typeof homeworks.$inferSelect;
  problems: (typeof problems.$inferSelect & {
    correctAnswer: string;
    explanation: string | null;
    submissionStatus: {
      submitted: boolean;
      correct: boolean;
      userAnswer?: string;
    } | null;
  })[];
};

// Fetch homework review data
const { data, status, error } = await useFetch<HomeworkReviewDetail>(
  `/api/student/homeworks/${homeworkId}/review`
);

// State
const currentProblemIndex = ref(0);
const isExplaining = ref(false);
const aiExplanation = ref<string | null>(null);

const currentProblem = computed(() => {
  if (!data.value || !data.value.problems) return null;
  return data.value.problems[currentProblemIndex.value];
});

const isLastProblem = computed(() => {
  if (!data.value || !data.value.problems) return false;
  return currentProblemIndex.value === data.value.problems.length - 1;
});

const isFirstProblem = computed(() => {
  return currentProblemIndex.value === 0;
});

// Reset AI explanation when changing problems
watch(currentProblemIndex, () => {
  aiExplanation.value = null;
});

const nextProblem = () => {
  if (!data.value || !data.value.problems) return;
  if (currentProblemIndex.value < data.value.problems.length - 1) {
    currentProblemIndex.value++;
  }
};

const prevProblem = () => {
  if (currentProblemIndex.value > 0) {
    currentProblemIndex.value--;
  }
};

const jumpToProblem = (index: number) => {
  currentProblemIndex.value = index;
};

// Ask AI
const askAI = async () => {
  if (
    !currentProblem.value ||
    !currentProblem.value.submissionStatus?.userAnswer
  )
    return;

  isExplaining.value = true;
  try {
    const result = await $fetch("/api/ai/explain", {
      method: "POST",
      body: {
        problemId: currentProblem.value.id,
        userAnswer: currentProblem.value.submissionStatus.userAnswer,
      },
    });
    aiExplanation.value = result.explanation;
  } catch (e) {
    console.error("AI explanation failed", e);
  } finally {
    isExplaining.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto max-w-4xl pb-20 p-4">
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error">
      <span>Error loading homework review: {{ error.message }}</span>
      <NuxtLink to="/student/homeworks" class="btn btn-sm">Go Back</NuxtLink>
    </div>

    <!-- Review View -->
    <div v-else-if="currentProblem" class="space-y-6">
      <!-- Header with Progress -->
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="text-sm breadcrumbs">
            <ul>
              <li><NuxtLink to="/student/homeworks">Homeworks</NuxtLink></li>
              <li>{{ data?.homework.title }} (Review)</li>
            </ul>
          </div>
          <div class="badge badge-lg">
            Question {{ currentProblemIndex + 1 }} / {{ data?.problems.length }}
          </div>
        </div>

        <!-- Progress Bar / Indicators -->
        <div class="flex gap-2 flex-wrap justify-center">
          <button
            v-for="(problem, index) in data?.problems"
            :key="problem.id"
            @click="jumpToProblem(index)"
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2"
            :class="{
              'bg-success text-success-content border-success':
                problem.submissionStatus?.correct,
              'bg-error text-error-content border-error':
                !problem.submissionStatus?.correct,
              'ring-2 ring-primary ring-offset-2':
                currentProblemIndex === index,
            }"
          >
            {{ index + 1 }}
          </button>
        </div>
      </div>

      <!-- Problem Card -->
      <div class="card bg-base-100 shadow-xl relative">
        <!-- Navigation Buttons on Card -->
        <div class="absolute top-4 left-4 z-10">
          <button
            v-if="!isFirstProblem"
            @click="prevProblem"
            class="btn btn-circle btn-sm btn-ghost"
            title="Previous Problem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        <div class="absolute top-4 right-4 z-10">
          <button
            v-if="!isLastProblem"
            @click="nextProblem"
            class="btn btn-circle btn-sm btn-ghost"
            title="Next Problem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
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
        </div>

        <div class="card-body pt-12">
          <h2 class="card-title text-2xl justify-center">
            {{ currentProblem.title }}
          </h2>
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
            <div
              v-for="(text, key) in currentProblem.choices"
              :key="key"
              class="flex items-center p-4 border rounded-lg transition-colors"
              :class="{
                'border-success bg-success/10':
                  key === currentProblem.correctAnswer,
                'border-error bg-error/10':
                  key === currentProblem.submissionStatus?.userAnswer &&
                  key !== currentProblem.correctAnswer,
                'opacity-50':
                  key !== currentProblem.correctAnswer &&
                  key !== currentProblem.submissionStatus?.userAnswer,
              }"
            >
              <span class="font-bold mr-2">{{ key }}.</span>
              <span class="flex-1">{{ text }}</span>
              <span
                v-if="key === currentProblem.correctAnswer"
                class="badge badge-success ml-2"
                >Correct</span
              >
              <span
                v-if="key === currentProblem.submissionStatus?.userAnswer"
                class="badge badge-info ml-2"
                >Your Answer</span
              >
            </div>
          </div>

          <!-- Explanation Section -->
          <div class="mt-8 space-y-6">
            <div
              class="alert"
              :class="
                currentProblem.submissionStatus?.correct
                  ? 'alert-success'
                  : 'alert-error'
              "
            >
              <svg
                v-if="currentProblem.submissionStatus?.correct"
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{
                currentProblem.submissionStatus?.correct
                  ? "Correct! Great job."
                  : "Incorrect."
              }}</span>
            </div>

            <!-- Official Explanation -->
            <div class="collapse collapse-arrow bg-base-200">
              <input type="checkbox" checked />
              <div class="collapse-title text-xl font-medium">
                Official Solution
              </div>
              <div class="collapse-content">
                <MarkdownRenderer
                  :content="
                    currentProblem.explanation || 'No explanation provided.'
                  "
                />
              </div>
            </div>

            <!-- AI Tutor Section -->
            <div class="card bg-base-200 border-2 border-primary/20">
              <div class="card-body">
                <h3 class="card-title flex items-center gap-2">
                  <span class="text-2xl">🤖</span> AI Tutor
                </h3>
                <p class="text-sm opacity-70">
                  Still confused? Ask the AI for a personalized explanation.
                </p>

                <div v-if="aiExplanation" class="mt-4 prose">
                  <div class="chat chat-start">
                    <div class="chat-image avatar">
                      <div
                        class="w-10 rounded-full bg-primary text-primary-content grid place-items-center"
                      >
                        <span>AI</span>
                      </div>
                    </div>
                    <div class="chat-bubble chat-bubble-primary">
                      <MarkdownRenderer :content="aiExplanation" />
                    </div>
                  </div>
                </div>

                <div v-else class="card-actions mt-4">
                  <button
                    class="btn btn-outline btn-primary w-full"
                    @click="askAI"
                    :disabled="isExplaining"
                  >
                    <span
                      v-if="isExplaining"
                      class="loading loading-dots"
                    ></span>
                    <span v-else>Explain this to me</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles if needed */
</style>
