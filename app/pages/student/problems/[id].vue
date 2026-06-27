<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();

const route = useRoute();
const problemId = route.params.id as string;

// Fetch problem details
const { data: problem, error } = await useFetch(`/api/problems/${problemId}`);

// State
const selectedAnswer = ref<string | null>(null);
const isSubmitting = ref(false);
const submissionResult = ref<{
  correct: boolean;
  explanation: string | null;
  correctAnswer: string;
} | null>(null);

const isExplaining = ref(false);
const aiExplanation = ref<string | null>(null);

// Understood Button Logic
const isUnderstood = ref(false);
const isTogglingUnderstood = ref(false);

const toggleUnderstood = async () => {
  if (isTogglingUnderstood.value) return;

  isTogglingUnderstood.value = true;
  try {
    const result = await $fetch<{ understood: boolean }>(
      "/api/student/problems/understood",
      {
        method: "POST",
        body: {
          problemId,
        },
      }
    );
    isUnderstood.value = result.understood;
  } catch (e) {
    console.error("Failed to toggle understood status", e);
  } finally {
    isTogglingUnderstood.value = false;
  }
};

// Submit Answer
const submitAnswer = async () => {
  if (selectedAnswer.value === null) return;

  isSubmitting.value = true;
  try {
    const result = await $fetch("/api/submissions", {
      method: "POST",
      body: {
        problemId,
        userAnswer: selectedAnswer.value,
      },
    });
    submissionResult.value = result;
    // Reset understood status on new submission, especially if it's incorrect (backend resets it too)
    if (!result.correct) {
      isUnderstood.value = false;
    }
  } catch (e) {
    console.error("Submission failed", e);
  } finally {
    isSubmitting.value = false;
  }
};

// Ask AI
const askAI = async () => {
  if (selectedAnswer.value === null) return;

  isExplaining.value = true;
  try {
    const result = await $fetch("/api/ai/explain", {
      method: "POST",
      body: {
        problemId,
        userAnswer: selectedAnswer.value,
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
  <div class="container mx-auto max-w-3xl pb-20 p-4">
    <div class="mb-4">
      <NuxtLink
        :to="localePath('/student/problems')"
        class="btn btn-ghost btn-sm gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        {{ $t("student.problems.back") }}
      </NuxtLink>
    </div>

    <div v-if="problem" class="card bg-base-100 shadow-xl">
      <div class="card-body p-4 md:p-8">
        <div class="flex justify-between items-start gap-2">
          <h1 class="card-title text-2xl">{{ problem.title }}</h1>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            <div class="badge badge-outline">{{ problem.difficulty }}</div>
            <div v-if="problem.source" class="badge badge-ghost">
              {{ problem.source }}
            </div>
            <StudentFavoriteButton :problem-id="problemId" :is-favorite="problem.isFavorite ?? false" />
            <StudentAddToListDropdown :problem-id="problemId" />
          </div>
        </div>

        <MarkdownRenderer :content="problem.content" class="py-4 text-lg" />

        <!-- Problem Image -->
        <div v-if="problem.imageUrl" class="my-4 flex justify-center">
          <img
            :src="problem.imageUrl"
            alt="Problem Image"
            class="max-h-96 rounded-lg shadow-md object-contain"
          />
        </div>

        <div class="divider"></div>

        <!-- Choices -->
        <div class="form-control space-y-3">
          <label
            v-for="(text, key) in problem.choices"
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
            <div class="label-text text-base flex-1 flex items-start">
              <span class="font-bold mr-2">{{ key }}.</span>
              <MarkdownRenderer :content="text" class="flex-1" />
            </div>
            <input
              type="radio"
              name="radio-10"
              class="radio radio-primary"
              :value="key"
              v-model="selectedAnswer"
              :disabled="!!submissionResult"
            />
          </label>
        </div>

        <!-- Actions -->
        <div class="card-actions justify-end mt-6">
          <button
            v-if="!submissionResult"
            class="btn btn-primary"
            @click="submitAnswer"
            :disabled="selectedAnswer === null || isSubmitting"
          >
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
            {{ $t("student.problems.submit_answer") }}
          </button>
        </div>

        <!-- Results Section -->
        <div v-if="submissionResult" class="mt-6 space-y-6 animate-fade-in">
          <div
            class="alert"
            :class="submissionResult.correct ? 'alert-success' : 'alert-error'"
          >
            <svg
              v-if="submissionResult.correct"
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
              submissionResult.correct
                ? $t("student.problems.correct_message")
                : $t("student.problems.incorrect_message")
            }}</span>
          </div>

          <!-- Official Explanation -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" checked />
            <div class="collapse-title text-xl font-medium">
              {{ $t("student.problems.official_solution") }}
            </div>
            <div class="collapse-content">
              <MarkdownRenderer :content="submissionResult.explanation || ''" />
            </div>
          </div>

          <!-- AI Tutor Section -->
          <div class="card bg-base-200 border-2 border-primary/20">
            <div class="card-body">
              <h3 class="card-title flex items-center gap-2">
                <span class="text-2xl">🤖</span>
                {{ $t("student.problems.ai_tutor") }}
              </h3>
              <p class="text-sm opacity-70">
                {{ $t("student.problems.ai_tutor_desc") }}
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
                  <span v-else>{{ $t("student.problems.ask_ai_button") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Understood Button -->
        <div
          v-if="submissionResult && !submissionResult.correct"
          class="flex justify-end mt-4"
        >
          <button
            class="btn gap-2 transition-all duration-300"
            :class="
              isUnderstood
                ? 'btn-success text-white'
                : 'btn-outline btn-warning'
            "
            @click="toggleUnderstood"
            :disabled="isTogglingUnderstood"
          >
            <span
              v-if="isTogglingUnderstood"
              class="loading loading-spinner loading-sm"
            ></span>
            <svg
              v-if="isUnderstood"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{
              isUnderstood
                ? $t("student.problems.understood")
                : $t("student.problems.mark_as_understood")
            }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span
        >{{ $t("student.problems.error_loading") }} {{ error.message }}</span
      >
    </div>

    <div v-else class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
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
