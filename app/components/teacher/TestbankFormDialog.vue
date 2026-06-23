<script setup lang="ts">
interface TestbankData {
  id?: string;
  name: string;
  description: string | null;
  isPublic: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  testbank?: TestbankData;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
}>();

const isEdit = computed(() => !!props.testbank?.id);

const form = ref({
  name: "",
  description: "",
  isPublic: false,
});

const saving = ref(false);

const dialogRef = ref<HTMLDialogElement | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.testbank) {
        form.value = {
          name: props.testbank.name,
          description: props.testbank.description ?? "",
          isPublic: props.testbank.isPublic,
        };
      } else {
        form.value = { name: "", description: "", isPublic: false };
      }
      dialogRef.value?.showModal();
    } else {
      dialogRef.value?.close();
    }
  }
);

const close = () => {
  emit("update:modelValue", false);
};

const save = async () => {
  if (!form.value.name.trim()) return;

  saving.value = true;
  const { $i18n } = useNuxtApp();

  try {
    if (isEdit.value && props.testbank?.id) {
      await $fetch(`/api/teacher/testbanks/${props.testbank.id}`, {
        method: "PUT",
        body: {
          name: form.value.name,
          description: form.value.description || null,
          isPublic: form.value.isPublic,
        },
      });
      alert($i18n.t("teacher.problems.testbanks.update_success"));
    } else {
      await $fetch("/api/teacher/testbanks", {
        method: "POST",
        body: {
          name: form.value.name,
          description: form.value.description || null,
          isPublic: form.value.isPublic,
        },
      });
      alert($i18n.t("teacher.problems.testbanks.create_success"));
    }
    emit("saved");
    close();
  } catch (error) {
    console.error("Failed to save testbank:", error);
    alert(
      $i18n.t(
        isEdit.value
          ? "teacher.problems.testbanks.update_error"
          : "teacher.problems.testbanks.create_error"
      )
    );
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <dialog ref="dialogRef" class="modal" @close="close">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        {{
          isEdit
            ? $t("teacher.problems.testbanks.edit")
            : $t("teacher.problems.testbanks.create")
        }}
      </h3>
      <form @submit.prevent="save" class="space-y-4">
        <div class="form-control">
          <label class="label">
            {{ $t("teacher.problems.testbanks.name") }}
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input input-bordered"
            :placeholder="$t('teacher.problems.testbanks.name_placeholder')"
            required
          />
        </div>
        <div class="form-control">
          <label class="label">
            {{ $t("teacher.problems.testbanks.description") }}
          </label>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered"
            :placeholder="$t('teacher.problems.testbanks.description_placeholder')"
          ></textarea>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="form.isPublic"
              type="checkbox"
              class="toggle toggle-success"
            />
            <span>
              {{
                form.isPublic
                  ? $t("teacher.problems.testbanks.make_public")
                  : $t("teacher.problems.testbanks.make_private")
              }}
            </span>
          </label>
        </div>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="close">
            {{ $t("teacher.problems.form.cancel") }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{
              isEdit
                ? $t("teacher.problems.testbanks.edit")
                : $t("teacher.problems.testbanks.create")
            }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>
