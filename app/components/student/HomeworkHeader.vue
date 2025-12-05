<script setup lang="ts">
const localePath = useLocalePath();
interface ProblemStatus {
  id: string;
  submissionStatus: {
    submitted: boolean;
    correct: boolean;
  } | null;
}

const props = defineProps<{
  title: string;
  currentIndex: number;
  problems: ProblemStatus[];
  mode: "take" | "review";
}>();

const emit = defineEmits<{
  (e: "jump", index: number): void;
}>();

const getCircleClass = (problem: ProblemStatus, index: number) => {
  const isCurrent = props.currentIndex === index;
  const baseClass =
    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2 cursor-pointer";

  let statusClass = "";
  let activeClass = isCurrent ? "ring-2 ring-primary ring-offset-2" : "";

  if (props.mode === "take") {
    if (problem.submissionStatus?.submitted) {
      statusClass = "bg-success text-success-content border-success";
    } else {
      statusClass = "bg-base-200 text-base-content border-base-300";
      if (isCurrent) activeClass += " border-primary";
    }
  } else {
    // Review mode
    if (problem.submissionStatus?.correct) {
      statusClass = "bg-success text-success-content border-success";
    } else {
      statusClass = "bg-error text-error-content border-error";
    }
  }

  return `${baseClass} ${statusClass} ${activeClass}`;
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
    >
      <div class="text-sm breadcrumbs">
        <ul>
          <li>
            <NuxtLink :to="localePath('/student/homeworks')">{{
              $t("components.student.homework_header.homeworks")
            }}</NuxtLink>
          </li>
          <li>
            {{ title }}
            <span v-if="mode === 'review'"
              >({{ $t("components.student.homework_header.review") }})</span
            >
          </li>
        </ul>
      </div>
      <div class="badge badge-lg">
        {{ $t("components.student.homework_header.question") }}
        {{ currentIndex + 1 }} / {{ problems.length }}
      </div>
    </div>

    <!-- Progress Bar / Indicators -->
    <div class="flex gap-2 flex-wrap justify-center">
      <button
        v-for="(problem, index) in problems"
        :key="problem.id"
        @click="emit('jump', index)"
        :class="getCircleClass(problem, index)"
      >
        {{ index + 1 }}
      </button>
    </div>
  </div>
</template>
