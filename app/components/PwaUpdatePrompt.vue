<script setup lang="ts">
const { $pwa } = useNuxtApp()
</script>

<template>
  <div v-if="$pwa?.needRefresh" class="toast toast-end toast-bottom z-50">
    <div class="alert alert-info shadow-lg">
      <span>有新版本可用</span>
      <div class="flex gap-2">
        <button class="btn btn-sm" @click="$pwa.updateServiceWorker()">
          更新
        </button>
        <button class="btn btn-sm btn-ghost" @click="$pwa.cancelPrompt()">
          稍後
        </button>
      </div>
    </div>
  </div>
</template>
