<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  projects: { id: string; name: string }[];
  currentProjectId?: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  move: [projectId: string | null];
}>();

const { t } = useI18n();

const selectedProjectId = ref<string | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedProjectId.value = props.currentProjectId ?? null;
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

function confirm() {
  emit("move", selectedProjectId.value);
  close();
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg mb-4">
        {{ t("chat.move_to_project") }}
      </h3>

      <select v-model="selectedProjectId" class="select select-bordered w-full">
        <option :value="null">{{ t("chat.unorganized") }}</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>

      <div class="modal-action">
        <button class="btn" @click="close">
          {{ t("chat.cancel") }}
        </button>
        <button class="btn btn-primary" @click="confirm">
          {{ t("chat.confirm") }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="close">
      <button>close</button>
    </form>
  </dialog>
</template>
