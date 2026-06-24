<script setup lang="ts">
interface SharedTestbank {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

defineProps<{
  testbank: SharedTestbank;
}>();

const localePath = useLocalePath();
</script>

<template>
  <NuxtLink
    :to="localePath(`/student/problems?testbankId=${testbank.id}&name=${encodeURIComponent(testbank.name)}`)"
    class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
  >
    <div class="card-body p-4">
      <h3 class="card-title text-base">{{ testbank.name }}</h3>
      <p
        v-if="testbank.description"
        class="text-sm text-base-content/70 line-clamp-2"
      >
        {{ testbank.description }}
      </p>
      <div class="mt-2">
        <div class="badge badge-ghost badge-outline">
          {{
            $t("teacher.problems.testbanks.problem_count", {
              count: testbank.problemCount,
            })
          }}
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
