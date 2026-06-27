<script setup lang="ts">
const props = defineProps<{ problemId: string }>();

interface ProblemList {
  id: string;
  name: string;
  itemCount: number;
}

const lists = ref<ProblemList[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
const addingToListId = ref<string | null>(null);
const feedbackListId = ref<string | null>(null);
const feedbackMsg = ref<"added" | "already" | null>(null);

const isCreating = ref(false);
const newListName = ref("");
const isSavingNew = ref(false);

const fetchLists = async () => {
  if (lists.value.length > 0) return;
  isLoading.value = true;
  try {
    lists.value = await $fetch<ProblemList[]>("/api/student/problem-lists");
  } catch {
    // ignore
  } finally {
    isLoading.value = false;
  }
};

const openDropdown = async () => {
  isOpen.value = true;
  await fetchLists();
};

const closeDropdown = () => {
  isOpen.value = false;
  isCreating.value = false;
  newListName.value = "";
};

const addToList = async (listId: string) => {
  if (addingToListId.value) return;
  addingToListId.value = listId;
  try {
    const res = await $fetch<{ success: boolean; alreadyAdded: boolean }>(
      `/api/student/problem-lists/${listId}/items`,
      { method: "POST", body: { problemId: props.problemId } }
    );
    feedbackListId.value = listId;
    feedbackMsg.value = res.alreadyAdded ? "already" : "added";
    setTimeout(() => {
      feedbackListId.value = null;
      feedbackMsg.value = null;
      closeDropdown();
    }, 1200);
  } catch {
    // ignore
  } finally {
    addingToListId.value = null;
  }
};

const createAndAdd = async () => {
  if (!newListName.value.trim() || isSavingNew.value) return;
  isSavingNew.value = true;
  try {
    const newList = await $fetch<{ id: string; name: string }>("/api/student/problem-lists", {
      method: "POST",
      body: { name: newListName.value.trim() },
    });
    lists.value = [];
    await addToList(newList.id);
  } catch {
    // ignore
  } finally {
    isSavingNew.value = false;
  }
};
</script>

<template>
  <div class="relative">
    <button
      class="btn btn-sm btn-ghost gap-1"
      @click="openDropdown"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {{ $t("student.problem_lists.add_to_list") }}
    </button>

    <!-- Dropdown overlay -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeDropdown" />

    <div v-if="isOpen" class="absolute right-0 top-full mt-1 z-50 w-56 bg-base-100 border border-base-300 rounded-box shadow-lg">
      <div v-if="isLoading" class="p-3 text-center">
        <span class="loading loading-spinner loading-sm" />
      </div>

      <template v-else>
        <ul class="menu menu-sm p-2 max-h-48 overflow-y-auto">
          <li v-for="list in lists" :key="list.id">
            <button
              class="flex justify-between items-center"
              :disabled="addingToListId === list.id"
              @click.stop="addToList(list.id)"
            >
              <span class="truncate">{{ list.name }}</span>
              <span v-if="feedbackListId === list.id && feedbackMsg === 'added'" class="text-success text-xs">✓</span>
              <span v-else-if="feedbackListId === list.id && feedbackMsg === 'already'" class="text-base-content/50 text-xs">
                {{ $t("student.problem_lists.already_in_list") }}
              </span>
              <span v-else-if="addingToListId === list.id" class="loading loading-spinner loading-xs" />
            </button>
          </li>

          <li v-if="lists.length === 0" class="menu-title text-xs opacity-60 px-2">
            {{ $t("student.problem_lists.empty") }}
          </li>
        </ul>

        <div class="divider my-0" />

        <!-- Create new list inline -->
        <div v-if="!isCreating" class="p-2">
          <button class="btn btn-ghost btn-sm w-full justify-start gap-2" @click.stop="isCreating = true">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t("student.problem_lists.create_new_list") }}
          </button>
        </div>

        <div v-else class="p-2 flex gap-1">
          <input
            v-model="newListName"
            type="text"
            class="input input-bordered input-sm flex-1 min-w-0"
            :placeholder="$t('student.problem_lists.create_name_label')"
            autofocus
            @keyup.enter="createAndAdd"
            @keyup.esc="isCreating = false"
            @click.stop
          />
          <button
            class="btn btn-sm btn-primary"
            :disabled="!newListName.trim() || isSavingNew"
            @click.stop="createAndAdd"
          >
            <span v-if="isSavingNew" class="loading loading-spinner loading-xs" />
            <span v-else>{{ $t("student.problem_lists.create_submit") }}</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
