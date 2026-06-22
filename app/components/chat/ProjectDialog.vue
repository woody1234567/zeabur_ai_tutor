<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  project?: { id: string; name: string; description?: string | null; systemPrompt?: string | null } | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [data: { name: string; description: string; systemPrompt: string }];
}>();

const { t } = useI18n();

const name = ref("");
const description = ref("");
const systemPrompt = ref("");

const MAX_SYSTEM_PROMPT_LENGTH = 2000;

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      name.value = props.project?.name ?? "";
      description.value = props.project?.description ?? "";
      systemPrompt.value = props.project?.systemPrompt ?? "";
    }
  }
);

const isEdit = computed(() => !!props.project);

function close() {
  emit("update:modelValue", false);
}

function save() {
  if (!name.value.trim()) return;
  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    systemPrompt: systemPrompt.value.trim(),
  });
  close();
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">
        {{ isEdit ? t("chat.edit_project") : t("chat.new_project") }}
      </h3>

      <div class="form-control mb-3">
        <label class="label">
          <span class="label-text">{{ t("chat.project_name") }}</span>
        </label>
        <input
          v-model="name"
          type="text"
          class="input input-bordered w-full"
          :placeholder="t('chat.project_name_placeholder')"
        />
      </div>

      <div class="form-control mb-3">
        <label class="label">
          <span class="label-text">{{ t("chat.project_description") }}</span>
        </label>
        <textarea
          v-model="description"
          class="textarea textarea-bordered w-full h-20"
          :placeholder="t('chat.project_description_placeholder')"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">{{ t("chat.system_prompt") }}</span>
        </label>
        <textarea
          v-model="systemPrompt"
          class="textarea textarea-bordered w-full h-32"
          :placeholder="t('chat.system_prompt_placeholder')"
          :maxlength="MAX_SYSTEM_PROMPT_LENGTH"
        />
        <label class="label">
          <span class="label-text-alt text-base-content/50">
            {{ t("chat.system_prompt_hint") }}
          </span>
          <span class="label-text-alt text-base-content/50">
            {{ systemPrompt.length }}/{{ MAX_SYSTEM_PROMPT_LENGTH }}
          </span>
        </label>
      </div>

      <div class="modal-action">
        <button class="btn" @click="close">
          {{ t("chat.cancel") }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="!name.trim()"
          @click="save"
        >
          {{ t("chat.save") }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="close">
      <button>close</button>
    </form>
  </dialog>
</template>
