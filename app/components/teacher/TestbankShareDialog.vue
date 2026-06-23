<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  testbankId: string;
  testbankName: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const saving = ref(false);
const selectedIds = ref<string[]>([]);
const loading = ref(false);

interface Classroom {
  id: string;
  name: string;
}

const classrooms = ref<Classroom[]>([]);
const currentShared = ref<string[]>([]);

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      dialogRef.value?.showModal();
      loading.value = true;
      try {
        const [allClassrooms, shared] = await Promise.all([
          $fetch<Classroom[]>("/api/teacher/classrooms"),
          $fetch<{ classroomId: string; classroomName: string }[]>(
            `/api/teacher/testbanks/${props.testbankId}/classrooms`
          ),
        ]);
        classrooms.value = allClassrooms;
        currentShared.value = shared.map((s) => s.classroomId);
        selectedIds.value = [...currentShared.value];
      } catch (error) {
        console.error("Failed to load classrooms:", error);
      } finally {
        loading.value = false;
      }
    } else {
      dialogRef.value?.close();
    }
  }
);

const close = () => {
  emit("update:modelValue", false);
};

const toggleClassroom = (id: string) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(idx, 1);
  }
};

const save = async () => {
  saving.value = true;
  const { $i18n } = useNuxtApp();

  try {
    await $fetch(`/api/teacher/testbanks/${props.testbankId}/classrooms`, {
      method: "PUT",
      body: { classroomIds: selectedIds.value },
    });
    alert($i18n.t("teacher.problems.testbanks.share_success"));
    emit("saved");
    close();
  } catch (error) {
    console.error("Failed to update sharing:", error);
    alert($i18n.t("teacher.problems.testbanks.share_error"));
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <dialog ref="dialogRef" class="modal" @close="close">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-2">
        {{ $t("teacher.problems.testbanks.share_title", { name: testbankName }) }}
      </h3>
      <p class="text-base-content/70 text-sm mb-4">
        {{ $t("teacher.problems.testbanks.share_desc") }}
      </p>

      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="classrooms.length === 0" class="text-center py-8 text-base-content/70">
        {{ $t("teacher.problems.testbanks.no_classrooms") }}
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <label
          v-for="classroom in classrooms"
          :key="classroom.id"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 cursor-pointer"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            :checked="selectedIds.includes(classroom.id)"
            @change="toggleClassroom(classroom.id)"
          />
          <span>{{ classroom.name }}</span>
        </label>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="close">
          {{ $t("teacher.problems.form.cancel") }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="saving || loading"
          @click="save"
        >
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          {{ $t("teacher.problems.testbanks.share") }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>
