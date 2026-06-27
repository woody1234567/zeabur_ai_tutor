<script setup lang="ts">
definePageMeta({ layout: "student" });

const localePath = useLocalePath();

interface ProblemList {
  id: string;
  name: string;
  description: string | null;
  shareToken: string | null;
  itemCount: number;
  createdAt: string;
}

const { data: lists, refresh } = await useFetch<ProblemList[]>("/api/student/problem-lists");

// Create modal
const showCreateModal = ref(false);
const newName = ref("");
const newDesc = ref("");
const isCreating = ref(false);

const openCreate = () => {
  newName.value = "";
  newDesc.value = "";
  showCreateModal.value = true;
};

const submitCreate = async () => {
  if (!newName.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    await $fetch("/api/student/problem-lists", {
      method: "POST",
      body: { name: newName.value.trim(), description: newDesc.value.trim() || undefined },
    });
    showCreateModal.value = false;
    await refresh();
  } catch {
    // ignore
  } finally {
    isCreating.value = false;
  }
};

// Delete
const deletingId = ref<string | null>(null);

const deleteList = async (id: string) => {
  if (!confirm($t("student.problem_lists.delete_confirm"))) return;
  deletingId.value = id;
  try {
    await $fetch(`/api/student/problem-lists/${id}`, { method: "DELETE" });
    await refresh();
  } catch {
    // ignore
  } finally {
    deletingId.value = null;
  }
};

const { t: $t } = useI18n();
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">{{ $t("student.problem_lists.title") }}</h1>
      <button class="btn btn-primary" @click="openCreate">
        {{ $t("student.problem_lists.create") }}
      </button>
    </div>

    <div v-if="lists && lists.length > 0" class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="list in lists"
        :key="list.id"
        class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start gap-2">
            <NuxtLink
              :to="localePath(`/student/problem-lists/${list.id}`)"
              class="card-title text-base hover:text-primary transition-colors flex-1 min-w-0"
            >
              <span class="truncate">{{ list.name }}</span>
            </NuxtLink>
            <button
              class="btn btn-ghost btn-xs text-error"
              :disabled="deletingId === list.id"
              @click="deleteList(list.id)"
            >
              <span v-if="deletingId === list.id" class="loading loading-spinner loading-xs" />
              <span v-else>{{ $t("student.problem_lists.delete") }}</span>
            </button>
          </div>

          <p v-if="list.description" class="text-sm text-base-content/70 line-clamp-2">{{ list.description }}</p>

          <div class="flex items-center gap-2 mt-2">
            <span class="badge badge-ghost badge-outline text-xs">
              {{ $t("student.problem_lists.items", { count: list.itemCount }) }}
            </span>
            <span v-if="list.shareToken" class="badge badge-success badge-outline text-xs">
              {{ $t("student.problem_lists.sharing_enabled") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="lists && lists.length === 0" class="text-center py-16 text-base-content/70">
      <p class="text-lg mb-4">{{ $t("student.problem_lists.empty") }}</p>
      <button class="btn btn-primary" @click="openCreate">
        {{ $t("student.problem_lists.create") }}
      </button>
    </div>

    <div v-else class="text-center py-10">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Create modal -->
    <dialog :class="['modal', showCreateModal && 'modal-open']">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ $t("student.problem_lists.create") }}</h3>
        <div class="form-control mb-3">
          <label class="label">
            <span class="label-text">{{ $t("student.problem_lists.create_name_label") }}</span>
          </label>
          <input
            v-model="newName"
            type="text"
            class="input input-bordered"
            :placeholder="$t('student.problem_lists.create_name_label')"
            @keyup.enter="submitCreate"
          />
        </div>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">{{ $t("student.problem_lists.create_desc_label") }}</span>
          </label>
          <textarea v-model="newDesc" class="textarea textarea-bordered" rows="2" />
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!newName.trim() || isCreating" @click="submitCreate">
            <span v-if="isCreating" class="loading loading-spinner loading-sm" />
            {{ $t("student.problem_lists.create_submit") }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showCreateModal = false" />
    </dialog>
  </div>
</template>
