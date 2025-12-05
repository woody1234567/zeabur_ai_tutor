<script setup lang="ts">
import type { homeworks, problems } from "~~/db/schema";
import HomeworkHeader from "~/components/student/HomeworkHeader.vue";
import ProblemCard from "~/components/student/ProblemCard.vue";

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
      <span
        >{{ $t("homeworks.review.error_loading") }} {{ error.message }}</span
      >
      <NuxtLink to="/student/homeworks" class="btn btn-sm">{{
        $t("homeworks.review.go_back")
      }}</NuxtLink>
    </div>

    <!-- Review View -->
    <div v-else-if="currentProblem && data" class="space-y-6">
      <HomeworkHeader
        :title="data.homework.title"
        :current-index="currentProblemIndex"
        :problems="data.problems"
        mode="review"
        @jump="jumpToProblem"
      />

      <ProblemCard
        :problem="currentProblem"
        :current-index="currentProblemIndex"
        :total-problems="data.problems.length"
        @prev="prevProblem"
        @next="nextProblem"
      >
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
            <span class="flex-1 flex items-start">
              <MarkdownRenderer :content="text" />
            </span>
            <span
              v-if="key === currentProblem.correctAnswer"
              class="badge badge-success ml-2"
              >{{ $t("homeworks.review.correct_badge") }}</span
            >
            <span
              v-if="key === currentProblem.submissionStatus?.userAnswer"
              class="badge badge-info ml-2"
              >{{ $t("homeworks.review.your_answer_badge") }}</span
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
                ? $t("homeworks.review.correct_message")
                : $t("homeworks.review.incorrect_message")
            }}</span>
          </div>

          <!-- Official Explanation -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" checked />
            <div class="collapse-title text-xl font-medium">
              {{ $t("homeworks.review.official_solution") }}
            </div>
            <div class="collapse-content">
              <MarkdownRenderer
                :content="
                  currentProblem.explanation ||
                  $t('homeworks.review.no_explanation')
                "
              />
            </div>
          </div>

          <!-- AI Tutor Section -->
          <div class="card bg-base-200 border-2 border-primary/20">
            <div class="card-body">
              <h3 class="card-title flex items-center gap-2">
                <span class="text-2xl">🤖</span>
                {{ $t("homeworks.review.ai_tutor") }}
              </h3>
              <p class="text-sm opacity-70">
                {{ $t("homeworks.review.ai_tutor_desc") }}
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
                  <span v-if="isExplaining" class="loading loading-dots"></span>
                  <span v-else>{{ $t("homeworks.review.ask_ai_button") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProblemCard>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles if needed */
</style>
