<script setup lang="ts">
const props = defineProps<{
  problem: {
    id: any;
    title: string;
    difficulty: string | null;
    subject?: string | null;
    chapter?: string | null;
    grade?: string | null;
    source?: string | null;
    testbanks?: { name: string; ownerName: string }[] | null;
    hashtags: string[] | null;
    isWrong?: boolean | null;
    understood?: boolean | null;
    isFavorite?: boolean | null;
  };
}>();

const localePath = useLocalePath();
const loading = ref(false);

const toggleFavorite = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    if (props.problem.isFavorite) {
      await $fetch("/api/favorite", {
        method: "DELETE",
        body: { problemId: props.problem.id },
      });
      props.problem.isFavorite = false;
    } else {
      await $fetch("/api/favorite", {
        method: "POST",
        body: { problemId: props.problem.id },
      });
      props.problem.isFavorite = true;
    }
  } catch (error) {
    console.error("Failed to toggle favorite", error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
    <div class="card-body">
      <h2 class="card-title text-lg">{{ problem.title }}</h2>
      <div
        v-if="problem.testbanks && problem.testbanks.length"
        class="flex flex-col gap-1 mt-1"
      >
        <div
          v-for="(tb, idx) in problem.testbanks"
          :key="idx"
          class="flex items-center gap-1 text-xs text-base-content/60"
        >
          <Icon name="heroicons:building-library" class="w-4 h-4 shrink-0" />
          <span class="font-medium">{{ tb.name }}</span>
          <span class="opacity-70">·</span>
          <span>{{ $t("student.problems.created_by", { name: tb.ownerName }) }}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
        <div v-if="problem.difficulty" class="flex items-center gap-1">
          <span class="text-base-content/60">{{ $t("student.problems.difficulty_label") }}:</span>
          <span
            class="font-medium"
            :class="{
              'text-success': problem.difficulty === 'easy',
              'text-warning': problem.difficulty === 'medium',
              'text-error': problem.difficulty === 'hard',
            }"
          >{{ problem.difficulty }}</span>
        </div>
        <div v-if="problem.subject" class="flex items-center gap-1">
          <span class="text-base-content/60">{{ $t("student.problems.subject_label") }}:</span>
          <span class="font-medium">{{ problem.subject }}</span>
        </div>
        <div v-if="problem.grade" class="flex items-center gap-1">
          <span class="text-base-content/60">{{ $t("student.problems.grade_label") }}:</span>
          <span class="font-medium">{{ problem.grade }}</span>
        </div>
        <div v-if="problem.source" class="flex items-center gap-1 col-span-2">
          <span class="text-base-content/60">{{ $t("student.problems.source_label") }}:</span>
          <span class="font-medium">{{ problem.source }}</span>
        </div>
        <div v-if="problem.chapter" class="flex items-center gap-1 col-span-2">
          <span class="text-base-content/60">{{ $t("student.problems.chapter_label") }}:</span>
          <span class="font-medium">{{ problem.chapter }}</span>
        </div>
      </div>
      <div v-if="problem.hashtags && problem.hashtags.length" class="flex gap-2 mt-2 flex-wrap">
        <div
          v-for="tag in problem.hashtags"
          :key="tag"
          class="badge badge-secondary badge-outline"
        >
          #{{ tag }}
        </div>
      </div>
      <div class="card-actions justify-between mt-4 items-center gap-2">
        <div class="flex items-center gap-1">
          <Icon
            v-if="problem.isWrong"
            name="heroicons:x-mark-20-solid"
            class="w-6 h-6 text-red-500 font-bold"
            title="Incorrectly answered"
          />
          <Icon
            v-if="problem.understood"
            name="heroicons:check-circle-20-solid"
            class="w-6 h-6 text-green-500 font-bold"
            title="Understood"
          />
        </div>
        <div class="flex gap-2 items-center">
          <button
            class="btn btn-ghost btn-circle btn-sm"
            @click="toggleFavorite"
            :disabled="loading"
          >
            <span
              v-if="loading"
              class="loading loading-spinner loading-xs"
            ></span>
            <Icon
              v-else
              :name="
                problem.isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'
              "
              class="w-5 h-5"
              :class="{ 'text-red-500': problem.isFavorite }"
            />
          </button>
          <NuxtLink
            :to="localePath(`/student/problems/${problem.id}`)"
            class="btn btn-ghost btn-sm"
          >
            {{ $t("student.problems.solve") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
