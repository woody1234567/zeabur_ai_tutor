<script setup lang="ts">
interface Testbank {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

defineProps<{
  testbank: Testbank;
}>();

const emit = defineEmits<{
  (e: "edit", testbank: Testbank): void;
  (e: "delete", testbank: Testbank): void;
  (e: "share", testbank: Testbank): void;
  (e: "click", testbank: Testbank): void;
}>();
</script>

<template>
  <div
    class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
    @click="emit('click', testbank)"
  >
    <div class="card-body">
      <h2 class="card-title text-lg">
        {{ testbank.name }}
      </h2>
      <p v-if="testbank.description" class="text-base-content/70 text-sm">
        {{ testbank.description }}
      </p>
      <div class="flex gap-2 mt-2 flex-wrap">
        <div
          class="badge"
          :class="testbank.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{
            testbank.isPublic
              ? $t("teacher.problems.testbanks.is_public")
              : $t("teacher.problems.testbanks.is_private")
          }}
        </div>
        <div class="badge badge-ghost badge-outline">
          {{ $t("teacher.problems.testbanks.problem_count", { count: testbank.problemCount }) }}
        </div>
      </div>
      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-warning btn-sm"
          @click.stop="emit('edit', testbank)"
        >
          {{ $t("teacher.problems.testbanks.edit") }}
        </button>
        <button
          v-if="!testbank.isPublic"
          class="btn btn-info btn-sm"
          @click.stop="emit('share', testbank)"
        >
          {{ $t("teacher.problems.testbanks.share") }}
        </button>
        <button
          class="btn btn-error btn-sm"
          @click.stop="emit('delete', testbank)"
        >
          {{ $t("teacher.problems.testbanks.delete") }}
        </button>
      </div>
    </div>
  </div>
</template>
