<script setup lang="ts">
const props = defineProps<{
  classroomId: string; // Ensure this is always passed as a string
  userType: "teacher" | "student";
}>();

const apiEndpoint = computed(() =>
  props.userType === "teacher"
    ? `/api/teacher/classrooms/${props.classroomId}/materials`
    : `/api/student/classrooms/${props.classroomId}/materials`
);

// Navigation state
const currentPath = ref<{ id: string; name: string }[]>([]);
const currentFolderId = computed(() =>
  currentPath.value.length > 0
    ? currentPath.value[currentPath.value.length - 1].id
    : undefined
);

// Fetch materials
const {
  data: materials,
  pending,
  error,
  refresh,
} = await useFetch<any[]>(apiEndpoint, {
  query: computed(() => ({
    parentId: currentFolderId.value,
  })),
  watch: [currentFolderId], // Refresh when folder changes
});

// Actions
function enterFolder(item: any) {
  currentPath.value.push({ id: item.id, name: item.name });
}

function navigateToBreadcrumb(index: number) {
  if (index === -1) {
    currentPath.value = [];
  } else {
    currentPath.value = currentPath.value.slice(0, index + 1);
  }
}

function openItem(item: any) {
  if (item.isFolder) {
    enterFolder(item);
  } else if (item.url) {
    window.open(item.url, "_blank");
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Breadcrumbs -->
    <div class="text-sm breadcrumbs">
      <ul>
        <li>
          <a @click="navigateToBreadcrumb(-1)">
            <Icon name="heroicons:home" class="w-4 h-4 mr-1" />
            {{ $t("components.common.materials_list.home") }}
          </a>
        </li>
        <li v-for="(crumb, index) in currentPath" :key="crumb.id">
          <a @click="navigateToBreadcrumb(index)">
            <Icon name="heroicons:folder" class="w-4 h-4 mr-1" />
            {{ crumb.name }}
          </a>
        </li>
      </ul>
    </div>

    <!-- Loading/Error -->
    <div v-if="pending" class="flex justify-center py-8">
      <span class="loading loading-spinner"></span>
    </div>
    <div v-else-if="error" class="alert alert-error">
      <span>{{ error.message }}</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!materials || materials.length === 0"
      class="flex flex-col items-center justify-center p-8 bg-base-100 rounded-lg border border-dashed border-base-300 text-base-content/50"
    >
      <Icon name="heroicons:folder-open" class="w-12 h-12 mb-2 opacity-50" />
      <p>{{ $t("components.common.materials_list.no_materials") }}</p>
    </div>

    <!-- Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="item in materials"
        :key="item.id"
        class="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer border border-base-200"
        @click="openItem(item)"
      >
        <div class="card-body p-4 flex flex-col items-center text-center">
          <div class="mb-2">
            <Icon
              v-if="item.isFolder"
              name="heroicons:folder-solid"
              class="w-12 h-12 text-yellow-500"
            />
            <Icon
              v-else-if="item.type?.includes('pdf')"
              name="heroicons:document-text-solid"
              class="w-12 h-12 text-red-500"
            />
            <Icon
              v-else-if="item.type?.includes('image')"
              name="heroicons:photo-solid"
              class="w-12 h-12 text-blue-500"
            />
            <Icon
              v-else
              name="heroicons:document-solid"
              class="w-12 h-12 text-gray-500"
            />
          </div>
          <h3
            class="font-medium text-sm line-clamp-2 w-full"
            :title="item.name"
          >
            {{ item.name }}
          </h3>
          <!-- Helper text for shared items at root -->
          <span
            v-if="!currentFolderId && item.sharedAt"
            class="text-xs text-gray-400 mt-1"
          >
            {{ $t("components.common.materials_list.shared") }}
            {{ new Date(item.sharedAt).toLocaleDateString() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
