<script setup lang="ts">
definePageMeta({
  layout: "student",
});

const { t } = useI18n();
const useWebSearch = ref(false);
</script>

<template>
  <ChatView role="student" :extra-body="() => ({ useWebSearch })">
    <template #toolbar-start="{ isLoading }">
      <button
        class="btn btn-ghost btn-square"
        :class="{ 'btn-active text-primary': useWebSearch }"
        @click="useWebSearch = !useWebSearch"
        :disabled="isLoading"
        :title="t('student.chat.web_search')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      </button>
    </template>
  </ChatView>
</template>
