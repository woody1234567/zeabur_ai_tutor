<script setup lang="ts">
const props = defineProps<{
  role: "teacher" | "student";
  modelValue: string[];
}>();
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const { t } = useI18n();

const TOOLKITS = [
  { slug: "gmail", label: "Gmail" },
  { slug: "googlecalendar", label: "Google Calendar" },
  { slug: "google_drive", label: "Google Drive" },
] as const;

const isConnecting = ref<string | null>(null);

const {
  data: status,
  refresh,
  status: fetchStatus,
} = await useFetch<Record<string, boolean>>(
  `/api/${props.role}/composio/status`,
  { lazy: false }
);

function isConnected(slug: string) {
  return status.value?.[slug] === true;
}

function isEnabled(slug: string) {
  return props.modelValue.includes(slug);
}

function toggle(slug: string) {
  if (!isConnected(slug)) return;
  const next = props.modelValue.includes(slug)
    ? props.modelValue.filter((s) => s !== slug)
    : [...props.modelValue, slug];
  emit("update:modelValue", next);
}

async function connect(slug: string) {
  isConnecting.value = slug;
  try {
    const res = await $fetch<{ redirectUrl: string | null | undefined }>(
      `/api/${props.role}/composio/connect`,
      { method: "POST", body: { toolkit: slug } }
    );
    if (res.redirectUrl) {
      window.open(res.redirectUrl, "_blank");
    }
  } finally {
    isConnecting.value = null;
  }
}
</script>

<template>
  <div class="border-t border-base-300">
    <details open>
      <summary
        class="flex items-center justify-between px-3 py-2 cursor-pointer select-none hover:bg-base-200 text-sm font-medium"
      >
        <span>{{ t("chat.composio.title") }}</span>
        <button
          class="btn btn-ghost btn-xs"
          :class="{ loading: fetchStatus === 'pending' }"
          @click.stop.prevent="refresh()"
          :title="t('chat.composio.refresh')"
        >
          <svg
            v-if="fetchStatus !== 'pending'"
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </summary>

      <div class="px-2 pb-2 space-y-1">
        <div
          v-for="tk in TOOLKITS"
          :key="tk.slug"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          :class="isConnected(tk.slug) ? 'hover:bg-base-200' : ''"
        >
          <!-- Connection status dot -->
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="isConnected(tk.slug) ? 'bg-success' : 'bg-base-300'"
          />

          <span class="text-sm flex-1 truncate">{{ tk.label }}</span>

          <!-- Toggle (connected) or Connect button (not connected) -->
          <template v-if="isConnected(tk.slug)">
            <input
              type="checkbox"
              class="toggle toggle-success toggle-xs"
              :checked="isEnabled(tk.slug)"
              @change="toggle(tk.slug)"
            />
          </template>
          <template v-else>
            <button
              class="btn btn-xs btn-outline btn-primary"
              :class="{ loading: isConnecting === tk.slug }"
              :disabled="isConnecting === tk.slug"
              @click="connect(tk.slug)"
            >
              {{ t("chat.composio.connect") }}
            </button>
          </template>
        </div>

        <p
          v-if="modelValue.length > 0"
          class="text-xs text-base-content/50 px-2 pt-1"
        >
          {{ t("chat.composio.active_hint") }}
        </p>
      </div>
    </details>
  </div>
</template>
