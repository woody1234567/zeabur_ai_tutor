<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const localePath = useLocalePath();
const shareToken = route.params.shareToken as string;

interface AccessibleProblem {
  id: string;
  title: string;
  content: string;
  difficulty: string | null;
  subject: string | null;
  chapter: string | null;
  grade: string | null;
  source: string | null;
  hashtags: string[] | null;
  imageUrl: string | null;
}

interface ListItem {
  problemId: string;
  addedAt: string;
  accessible: boolean;
  problem: AccessibleProblem | null;
}

interface SharedListResponse {
  list: {
    id: string;
    name: string;
    description: string | null;
    ownerName: string;
  };
  items: ListItem[];
}

const { data, error } = await useFetch<SharedListResponse>(
  `/api/shared/problem-lists/${shareToken}`
);

const accessibleCount = computed(() => data.value?.items.filter((i) => i.accessible).length ?? 0);
const totalCount = computed(() => data.value?.items.length ?? 0);
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl py-10">
    <!-- Not found -->
    <div v-if="error" class="text-center py-16">
      <div class="text-5xl mb-4">🔒</div>
      <p class="text-xl text-base-content/70">{{ $t("shared.problem_lists.not_found") }}</p>
    </div>

    <template v-else-if="data">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-1">{{ data.list.name }}</h1>
        <p class="text-base-content/60 text-sm">{{ $t("shared.problem_lists.by", { name: data.list.ownerName }) }}</p>
        <p v-if="data.list.description" class="text-base-content/70 mt-2">{{ data.list.description }}</p>
        <p class="mt-3 text-sm text-base-content/60">
          {{ accessibleCount }} / {{ totalCount }} 題可存取
        </p>
      </div>

      <!-- Sign-in prompt if some problems are restricted -->
      <div
        v-if="data.items.some((i) => !i.accessible)"
        class="alert alert-info mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ $t("shared.problem_lists.sign_in_prompt") }}</span>
        <NuxtLink :to="localePath('/login')" class="btn btn-sm btn-primary">登入</NuxtLink>
      </div>

      <!-- Problem list -->
      <div class="space-y-3">
        <template v-for="item in data.items" :key="item.problemId">
          <!-- Accessible problem -->
          <div v-if="item.accessible && item.problem" class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body p-4">
              <h3 class="font-medium text-base">{{ item.problem.title }}</h3>
              <div class="flex gap-2 flex-wrap mt-1">
                <span v-if="item.problem.difficulty" class="badge badge-ghost badge-sm">{{ item.problem.difficulty }}</span>
                <span v-if="item.problem.subject" class="badge badge-ghost badge-sm">{{ item.problem.subject }}</span>
                <span v-if="item.problem.source" class="badge badge-outline badge-sm">{{ item.problem.source }}</span>
              </div>
              <div class="card-actions justify-end mt-2">
                <NuxtLink
                  :to="localePath(`/student/problems/${item.problem.id}`)"
                  class="btn btn-sm btn-outline btn-primary"
                >
                  練習
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Restricted problem -->
          <div v-else class="card bg-base-200 border border-base-300 opacity-60">
            <div class="card-body p-4 flex-row items-center gap-3">
              <span class="text-2xl">🔒</span>
              <div>
                <p class="font-medium text-sm">{{ $t("shared.problem_lists.restricted") }}</p>
                <p class="text-xs text-base-content/60">{{ $t("shared.problem_lists.restricted_desc") }}</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div v-else class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg" />
    </div>
  </div>
</template>
