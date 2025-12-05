<script setup lang="ts">
import type { homeworks, problems } from "~~/db/schema";
import HomeworkHeader from "~/components/student/HomeworkHeader.vue";
import ProblemCard from "~/components/student/ProblemCard.vue";

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
      userAnswer?: string;
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

const allProblemsSubmitted = computed(() => {
  if (!data.value || !data.value.problems) return false;
  return data.value.problems.every((p) => p.submissionStatus?.submitted);
});

// Reset state when changing problems
watch(
  currentProblemIndex,
  () => {
    if (currentProblem.value?.submissionStatus?.userAnswer) {
      selectedAnswer.value = currentProblem.value.submissionStatus.userAnswer;
    } else {
      selectedAnswer.value = null;
    }
    submissionResult.value = null;
  },
  { immediate: true }
);

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

  try {
    await $fetch(`/api/student/homeworks/${homeworkId}/complete`, {
      method: "POST",
    });
    await navigateTo("/student/homeworks");
  } catch (e) {
    console.error("Failed to complete homework", e);
    alert($t("homeworks.failed_complete"));
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
      <span>{{ $t("homeworks.error_loading") }} {{ error.message }}</span>
    </div>

    <!-- Start Screen -->
    <div v-else-if="!started && data" class="card bg-base-100 shadow-xl mt-10">
      <div class="card-body text-center p-4 md:p-8">
        <h1 class="text-4xl font-bold mb-4">{{ data.homework.title }}</h1>
        <p class="text-xl mb-6">
          {{ $t("homeworks.subject") }} {{ data.homework.subject }}
        </p>
        <div
          class="stats stats-vertical lg:stats-horizontal shadow mb-8 w-full"
        >
          <div class="stat">
            <div class="stat-title">{{ $t("homeworks.questions") }}</div>
            <div class="stat-value">{{ data.problems.length }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">{{ $t("homeworks.deadline") }}</div>
            <div class="stat-value text-lg">
              {{
                data.homework.deadline
                  ? new Date(data.homework.deadline).toLocaleDateString()
                  : $t("homeworks.no_deadline")
              }}
            </div>
          </div>
        </div>
        <div class="card-actions justify-center">
          <button @click="startHomework" class="btn btn-primary btn-lg">
            {{ $t("homeworks.start_button") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Problem View -->
    <div v-else-if="currentProblem && data" class="space-y-6">
      <HomeworkHeader
        :title="data.homework.title || $t('homeworks.untitled')"
        :current-index="currentProblemIndex"
        :problems="data.problems"
        mode="take"
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
          <label
            v-for="(text, key) in currentProblem.choices"
            :key="key"
            class="label cursor-pointer border rounded-lg p-4 hover:bg-base-200 transition-colors"
            :class="{
              'border-primary bg-primary/10': selectedAnswer === key,
            }"
          >
            <span class="label-text text-base flex-1 flex items-start">
              <span class="font-bold mr-2 mt-1">{{ key }}.</span>
              <MarkdownRenderer :content="text" />
            </span>
            <input
              type="radio"
              name="choices"
              class="radio radio-primary"
              :value="key"
              v-model="selectedAnswer"
            />
          </label>
        </div>

        <!-- Actions -->
        <div class="card-actions justify-center mt-8">
          <div
            v-if="currentProblem.submissionStatus?.submitted"
            class="alert alert-success w-full max-w-md mb-4"
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
            <span>{{ $t("homeworks.answer_submitted") }}</span>
          </div>

          <button
            class="btn btn-primary btn-wide"
            @click="submitAnswer"
            :disabled="selectedAnswer === null || isSubmitting"
          >
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
            {{
              currentProblem.submissionStatus?.submitted
                ? $t("homeworks.update_answer")
                : $t("homeworks.submit_answer")
            }}
          </button>
        </div>
      </ProblemCard>

      <!-- Finish Button Section -->
      <div v-if="isLastProblem" class="flex justify-center mt-8">
        <button
          class="btn btn-success btn-lg"
          @click="finishHomework"
          :disabled="!allProblemsSubmitted"
        >
          {{ $t("homeworks.finish_homework") }}
          <span v-if="!allProblemsSubmitted" class="text-xs block mt-1">{{
            $t("student.homeworks.complete_all")
          }}</span>
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
