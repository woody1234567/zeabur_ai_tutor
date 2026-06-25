<script setup lang="ts">
interface Project {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt?: string | null;
}

interface Chat {
  id: string;
  title?: string | null;
  projectId?: string | null;
  updatedAt: string;
}

const props = defineProps<{
  projects: Project[];
  chats: Chat[];
  currentChatId: string | null;
  currentProjectId: string | null;
}>();

const emit = defineEmits<{
  loadChat: [id: string];
  startNewChat: [projectId?: string | null];
  createProject: [];
  editProject: [project: Project];
  deleteProject: [id: string];
  moveChat: [chatId: string];
  selectProject: [projectId: string | null];
}>();

const { t } = useI18n();

const expandedProjects = ref<Set<string>>(new Set());

function toggleProject(projectId: string) {
  if (expandedProjects.value.has(projectId)) {
    expandedProjects.value.delete(projectId);
  } else {
    expandedProjects.value.add(projectId);
  }
}

function chatsForProject(projectId: string) {
  return props.chats.filter((c) => c.projectId === projectId);
}

const unorganizedChats = computed(() =>
  props.chats.filter((c) => !c.projectId)
);

function handleNewChat(projectId?: string | null) {
  emit("selectProject", projectId ?? null);
  emit("startNewChat", projectId);
}
</script>

<template>
  <div class="w-64 h-full bg-base-200 p-4 border-r border-base-300 flex flex-col">
    <!-- Action buttons -->
    <div class="flex gap-2 mb-4">
      <button class="btn btn-primary btn-sm flex-1" @click="handleNewChat(currentProjectId)">
        + {{ t("chat.new_chat_short") }}
      </button>
      <button
        class="btn btn-ghost btn-sm btn-square"
        :title="t('chat.new_project')"
        @click="emit('createProject')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto space-y-1">
      <!-- Projects -->
      <div v-for="project in projects" :key="project.id">
        <!-- Project header -->
        <div
          class="flex items-center gap-1 p-2 rounded-lg cursor-pointer hover:bg-base-300 transition-colors group"
          :class="{ 'bg-base-300': currentProjectId === project.id && !currentChatId }"
          @click="toggleProject(project.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 shrink-0 transition-transform"
            :class="{ 'rotate-90': expandedProjects.has(project.id) }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span class="text-sm font-medium truncate flex-1">{{ project.name }}</span>

          <!-- Project actions -->
          <div class="dropdown dropdown-end opacity-0 group-hover:opacity-100" @click.stop>
            <label tabindex="0" class="btn btn-ghost btn-xs btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </label>
            <ul tabindex="0" class="dropdown-content z-50 menu p-1 shadow-lg bg-base-100 rounded-box w-40">
              <li>
                <button class="text-xs" @click="handleNewChat(project.id)">
                  {{ t("chat.new_chat_short") }}
                </button>
              </li>
              <li>
                <button class="text-xs" @click="emit('editProject', project)">
                  {{ t("chat.edit_project") }}
                </button>
              </li>
              <li>
                <button class="text-xs text-error" @click="emit('deleteProject', project.id)">
                  {{ t("chat.delete_project") }}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Project chats (expandable) -->
        <div v-if="expandedProjects.has(project.id)" class="ml-4 space-y-1">
          <div
            v-for="chat in chatsForProject(project.id)"
            :key="chat.id"
            class="flex items-center gap-1 p-2 rounded-lg cursor-pointer hover:bg-base-300 transition-colors group/chat"
            :class="{ 'bg-base-300': currentChatId === chat.id }"
            @click="emit('loadChat', chat.id)"
          >
            <span class="text-sm truncate flex-1">
              {{ chat.title || t("chat.new_chat_short") }}
            </span>
            <button
              class="btn btn-ghost btn-xs btn-square opacity-0 group-hover/chat:opacity-100"
              :title="t('chat.move_to_project')"
              @click.stop="emit('moveChat', chat.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
          <div
            v-if="chatsForProject(project.id).length === 0"
            class="text-xs text-base-content/40 p-2"
          >
            {{ t("chat.no_chats_in_project") }}
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div v-if="projects.length > 0" class="divider my-1 text-xs text-base-content/40">
        {{ t("chat.unorganized") }}
      </div>

      <!-- Unorganized chats -->
      <div
        v-for="chat in unorganizedChats"
        :key="chat.id"
        class="flex items-center gap-1 p-2 rounded-lg cursor-pointer hover:bg-base-300 transition-colors group/chat"
        :class="{ 'bg-base-300': currentChatId === chat.id }"
        @click="emit('loadChat', chat.id)"
      >
        <span class="text-sm truncate flex-1">
          {{ chat.title || t("chat.new_chat_short") }}
        </span>
        <button
          v-if="projects.length > 0"
          class="btn btn-ghost btn-xs btn-square opacity-0 group-hover/chat:opacity-100"
          :title="t('chat.move_to_project')"
          @click.stop="emit('moveChat', chat.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
