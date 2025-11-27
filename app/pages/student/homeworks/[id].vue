<script setup lang="ts">
import type { homeworks, problems } from "~~/db/schema";

definePageMeta({
  layout: "student",
});

const route = useRoute();
const homeworkId = route.params.id as string;

type HomeworkDetail = {
  homework: typeof homeworks.$inferSelect;
  problems: (typeof problems.$inferSelect & {
    submissionStatus: {
      submitted: boolean;
      correct: boolean;
    } | null;
  })[];
};

// Fetch homework data
const { data, status, error, refresh } = await useFetch<HomeworkDetail>(
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

const isFirstProblem = computed(() => {
  return currentProblemIndex.value === 0;
});

const allProblemsSubmitted = computed(() => {
  if (!data.value || !data.value.problems) return false;
  return data.value.problems.every((p) => p.submissionStatus?.submitted);
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
  if (selectedAnswer.value === null || !currentProblem.value) return;

  isSubmitting.value = true;
  try {
    const result = await $fetch("/api/submissions", {
      method: "POST",
      body: {
        problemId: currentProblem.value.id,
        userAnswer: selectedAnswer.value,
        homeworkId: homeworkId,
      },
    });

    // Refresh data to ensure we have the latest status from server
    await refresh();

    // Move to next problem if not last
    if (!isLastProblem.value) {
      nextProblem();
    }
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

const prevProblem = () => {
  if (currentProblemIndex.value > 0) {
    currentProblemIndex.value--;
  }
};

const jumpToProblem = (index: number) => {
  currentProblemIndex.value = index;
};

const finishHomework = async () => {
  if (!allProblemsSubmitted.value) return;
  await navigateTo("/student/homeworks");
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
      <!-- Header with Progress -->
      <div class="flex flex-col gap-4">
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

        <!-- Progress Bar / Indicators -->
        <div class="flex gap-2 flex-wrap justify-center">
          <button
            v-for="(problem, index) in data?.problems"
            :key="problem.id"
            @click="jumpToProblem(index)"
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2"
            :class="{
              'bg-success text-success-content border-success':
                problem.submissionStatus?.submitted,
              'bg-base-200 text-base-content border-base-300':
                !problem.submissionStatus?.submitted,
              'border-primary ring-2 ring-primary ring-offset-2':
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
            <label
              v-for="(text, key) in currentProblem.choices"
              :key="key"
              class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
              :class="{
                'border-primary bg-primary/10': selectedAnswer === key,
                'opacity-50 cursor-not-allowed':
                  currentProblem.submissionStatus?.submitted,
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
                :disabled="!!currentProblem.submissionStatus?.submitted"
              />
            </label>
          </div>

          <!-- Actions -->
          <div class="card-actions justify-center mt-8">
            <div
              v-if="currentProblem.submissionStatus?.submitted"
              class="alert alert-success w-full max-w-md"
            >
              <svg
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
              <span>Answer Submitted</span>
            </div>

            <button
              v-else
              class="btn btn-primary btn-wide"
              @click="submitAnswer"
              :disabled="selectedAnswer === null || isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              Submit Answer
            </button>
          </div>
        </div>
      </div>

      <!-- Finish Button Section -->
      <div v-if="isLastProblem" class="flex justify-center mt-8">
        <button
          class="btn btn-success btn-lg"
          @click="finishHomework"
          :disabled="!allProblemsSubmitted"
        >
          Finish Homework
          <span v-if="!allProblemsSubmitted" class="text-xs ml-2"
            >(Complete all questions first)</span
          >
        </button>
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
