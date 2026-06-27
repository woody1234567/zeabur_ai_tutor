<script setup lang="ts">
definePageMeta({ layout: "student" });

const localePath = useLocalePath();
const route = useRoute();
const listId = route.params.id as string;

interface Problem {
  id: string;
  title: string;
  difficulty: string | null;
  subject: string | null;
  chapter: string | null;
  grade: string | null;
  source: string | null;
  hashtags: string[] | null;
}

interface ListItem {
  id: string;
  problemId: string;
  addedAt: string;
  problem: Problem;
}

interface ProblemList {
  id: string;
  name: string;
  description: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  items: ListItem[];
}

const { data: list, refresh } = await useFetch<ProblemList>(`/api/student/problem-lists/${listId}`);

// Edit
const isEditing = ref(false);
const editName = ref("");
const editDesc = ref("");
const isSaving = ref(false);

const startEdit = () => {
  editName.value = list.value?.name ?? "";
  editDesc.value = list.value?.description ?? "";
  isEditing.value = true;
};

const saveEdit = async () => {
  if (!editName.value.trim() || isSaving.value) return;
  isSaving.value = true;
  try {
    await $fetch(`/api/student/problem-lists/${listId}`, {
      method: "PUT",
      body: { name: editName.value.trim(), description: editDesc.value.trim() || null },
    });
    isEditing.value = false;
    await refresh();
  } catch {
    // ignore
  } finally {
    isSaving.value = false;
  }
};

// Remove item
const removingId = ref<string | null>(null);

const removeItem = async (problemId: string) => {
  if (removingId.value) return;
  removingId.value = problemId;
  try {
    await $fetch(`/api/student/problem-lists/${listId}/items/${problemId}`, { method: "DELETE" });
    await refresh();
  } catch {
    // ignore
  } finally {
    removingId.value = null;
  }
};

// Sharing
const isTogglingShare = ref(false);
const copied = ref(false);
const requestUrl = useRequestURL();

const shareUrl = computed(() => {
  if (!list.value?.shareToken) return null;
  return `${requestUrl.origin}/shared/problem-lists/${list.value.shareToken}`;
});

const enableShare = async () => {
  if (isTogglingShare.value) return;
  isTogglingShare.value = true;
  try {
    await $fetch(`/api/student/problem-lists/${listId}/share`, { method: "POST" });
    await refresh();
  } catch {
    // ignore
  } finally {
    isTogglingShare.value = false;
  }
};

const disableShare = async () => {
  if (isTogglingShare.value) return;
  isTogglingShare.value = true;
  try {
    await $fetch(`/api/student/problem-lists/${listId}/share`, { method: "DELETE" });
    await refresh();
  } catch {
    // ignore
  } finally {
    isTogglingShare.value = false;
  }
};

const copyLink = async () => {
  if (!shareUrl.value) return;
  await navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const { t: $t } = useI18n();
</script>

<template>
  <div class="container mx-auto p-4 max-w-5xl">
    <!-- Back link -->
    <NuxtLink :to="localePath('/student/problem-lists')" class="btn btn-ghost btn-sm gap-2 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {{ $t("student.problem_lists.back") }}
    </NuxtLink>

    <div v-if="list">
      <!-- Header -->
      <div class="mb-6">
        <div v-if="!isEditing" class="flex items-start gap-3">
          <div class="flex-1">
            <h1 class="text-3xl font-bold">{{ list.name }}</h1>
            <p v-if="list.description" class="text-base-content/70 mt-1">{{ list.description }}</p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="startEdit">{{ $t("student.problem_lists.edit") }}</button>
        </div>

        <div v-else class="card bg-base-200 p-4">
          <div class="form-control mb-2">
            <input v-model="editName" type="text" class="input input-bordered" @keyup.enter="saveEdit" />
          </div>
          <div class="form-control mb-3">
            <textarea v-model="editDesc" class="textarea textarea-bordered" rows="2" />
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn btn-ghost btn-sm" @click="isEditing = false">Cancel</button>
            <button class="btn btn-primary btn-sm" :disabled="!editName.trim() || isSaving" @click="saveEdit">
              <span v-if="isSaving" class="loading loading-spinner loading-xs" />
              {{ $t("student.problem_lists.save") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Share section -->
      <div class="card bg-base-200 p-4 mb-6">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="font-medium">{{ $t("student.problem_lists.sharing_enabled") }}:</span>
          <span v-if="list.shareToken" class="badge badge-success">{{ $t("student.problem_lists.sharing_enabled") }}</span>
          <span v-else class="badge badge-ghost">{{ $t("student.problem_lists.sharing_disabled") }}</span>

          <template v-if="list.shareToken">
            <input :value="shareUrl" class="input input-bordered input-sm flex-1 min-w-48" readonly @click="($event.target as HTMLInputElement).select()" />
            <button class="btn btn-sm btn-outline" @click="copyLink">
              {{ copied ? $t("student.problem_lists.copied") : $t("student.problem_lists.copy_link") }}
            </button>
            <button class="btn btn-sm btn-error btn-outline" :disabled="isTogglingShare" @click="disableShare">
              <span v-if="isTogglingShare" class="loading loading-spinner loading-xs" />
              {{ $t("student.problem_lists.disable_share") }}
            </button>
          </template>

          <button v-else class="btn btn-sm btn-primary" :disabled="isTogglingShare" @click="enableShare">
            <span v-if="isTogglingShare" class="loading loading-spinner loading-xs" />
            {{ $t("student.problem_lists.enable_share") }}
          </button>
        </div>
      </div>

      <!-- Problems -->
      <div v-if="list.items.length > 0" class="space-y-3">
        <div
          v-for="item in list.items"
          :key="item.problemId"
          class="card bg-base-100 border border-base-200 shadow-sm"
        >
          <div class="card-body p-4 flex-row items-center gap-3">
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="localePath(`/student/problems/${item.problem.id}`)"
                class="font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {{ item.problem.title }}
              </NuxtLink>
              <div class="flex gap-2 mt-1 flex-wrap">
                <span v-if="item.problem.difficulty" class="badge badge-ghost badge-sm">{{ item.problem.difficulty }}</span>
                <span v-if="item.problem.subject" class="badge badge-ghost badge-sm">{{ item.problem.subject }}</span>
                <span v-if="item.problem.source" class="badge badge-outline badge-sm">{{ item.problem.source }}</span>
              </div>
            </div>
            <button
              class="btn btn-ghost btn-sm text-error shrink-0"
              :disabled="removingId === item.problemId"
              @click="removeItem(item.problemId)"
            >
              <span v-if="removingId === item.problemId" class="loading loading-spinner loading-xs" />
              <span v-else>{{ $t("student.problem_lists.remove_problem") }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-10 text-base-content/70">
        {{ $t("student.problem_lists.empty") }}
      </div>
    </div>

    <div v-else class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg" />
    </div>
  </div>
</template>
