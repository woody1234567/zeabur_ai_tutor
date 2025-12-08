<script setup lang="ts">
import { ref, computed } from "vue";
import type { Database } from "~/types/database.types"; // Assuming types exist or inferred

definePageMeta({
  layout: "teacher",
});

const currentPath = ref<string[]>([]); // Breadcrumbs names
const currentParentId = ref<string | undefined>(undefined);
const breadcrumbs = computed(() => {
  return [
    { id: undefined, name: "Home" },
    ...currentPath.value.map((name, i) => ({ name, id: "TODO_FIND_ID" })),
  ];
  // Complex to track IDs in breadcrumbs if we only store names.
  // Better: store entire folder objects in breadcrumbs path.
});

// Using a stack for breadcrumbs
const pathStack = ref<{ id: string | undefined; name: string }[]>([
  { id: undefined, name: "Home" },
]);

const currentFolder = computed(
  () => pathStack.value[pathStack.value.length - 1]
);

const {
  data: materials,
  refresh,
  error,
} = await useFetch("/api/teacher/materials", {
  query: computed(() => ({ parentId: currentFolder.value.id })),
});

// Actions
function enterFolder(folder: any) {
  pathStack.value.push({ id: folder.id, name: folder.name });
}

function openItem(item: any) {
  if (item.isFolder) {
    enterFolder(item);
  } else if (item.url) {
    window.open(item.url, "_blank");
  }
}

function navigateToBreadcrumb(index: number) {
  pathStack.value = pathStack.value.slice(0, index + 1);
}

// Create Folder
const showNewFolderModal = ref(false);
const newFolderName = ref("");
async function createFolder() {
  if (!newFolderName.value) return;
  try {
    await $fetch("/api/teacher/materials/folder", {
      method: "POST",
      body: {
        name: newFolderName.value,
        parentId: currentFolder.value.id,
      },
    });
    newFolderName.value = "";
    showNewFolderModal.value = false;
    refresh();
  } catch (e) {
    alert("Failed to create folder");
  }
}

// Upload
const showUploadModal = ref(false);
const uploadFiles = ref<FileList | null>(null);
const uploadMeta = ref({
  subject: "",
  chapter: "",
  source: "",
  hashtags: "",
});
const isUploading = ref(false);

async function handleUpload() {
  if (!uploadFiles.value || uploadFiles.value.length === 0) return;
  isUploading.value = true;

  const formData = new FormData();
  if (currentFolder.value.id)
    formData.append("parentId", currentFolder.value.id);
  formData.append("subject", uploadMeta.value.subject);
  formData.append("chapter", uploadMeta.value.chapter);
  formData.append("source", uploadMeta.value.source);
  // parse hashtags from string "tag1, tag2"
  const tags = uploadMeta.value.hashtags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  formData.append("hashtags", JSON.stringify(tags));

  for (let i = 0; i < uploadFiles.value.length; i++) {
    formData.append("files", uploadFiles.value[i]);
  }

  try {
    await $fetch("/api/teacher/materials", {
      method: "POST",
      body: formData,
    });
    showUploadModal.value = false;
    uploadFiles.value = null;
    uploadMeta.value = { subject: "", chapter: "", source: "", hashtags: "" };
    refresh();
  } catch (e) {
    alert("Upload failed");
  } finally {
    isUploading.value = false;
  }
}

// Delete
async function deleteItem(id: string) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  try {
    await $fetch("/api/teacher/materials", {
      method: "DELETE",
      query: { id },
    });
    refresh();
  } catch (e) {
    alert("Delete failed. If folder, make sure it is empty.");
  }
}

// Icons
// Using heroicons via Icon component
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Class Materials Workspace</h1>
      <div class="flex gap-2">
        <button class="btn btn-outline" @click="showNewFolderModal = true">
          <Icon name="heroicons:folder-plus" class="w-5 h-5 mr-1" />
          New Folder
        </button>
        <button class="btn btn-primary" @click="showUploadModal = true">
          <Icon name="heroicons:arrow-up-tray" class="w-5 h-5 mr-1" />
          Upload
        </button>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <div class="breadcrumbs text-sm mb-4">
      <ul>
        <li v-for="(crumb, index) in pathStack" :key="crumb.name">
          <a @click="navigateToBreadcrumb(index)">
            <Icon
              v-if="index === 0"
              name="heroicons:home"
              class="w-4 h-4 mr-1"
            />
            <Icon v-else name="heroicons:chevron-right" class="w-4 h-4 mr-1" />
            <Icon
              v-if="crumb.id"
              name="heroicons:folder"
              class="w-4 h-4 mr-1"
            />
            {{ crumb.name }}
          </a>
        </li>
      </ul>
    </div>

    <!-- File Explorer -->
    <div
      class="bg-base-100 rounded-lg shadow min-h-[500px] border border-base-200"
    >
      <div
        v-if="!materials || materials.length === 0"
        class="flex flex-col items-center justify-center h-64 text-base-content/50"
      >
        <Icon name="heroicons:folder-open" class="w-16 h-16 mb-2" />
        <p>This folder is empty</p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"
      >
        <div
          v-for="item in materials"
          :key="item.id"
          class="group relative border border-base-200 rounded-lg p-4 hover:bg-base-200 transition-colors cursor-pointer flex flex-col items-center text-center"
          @click="openItem(item)"
        >
          <!-- Icon -->
          <div class="mb-2">
            <Icon
              v-if="item.isFolder"
              name="heroicons:folder-solid"
              class="w-16 h-16 text-yellow-500"
            />
            <Icon
              v-else-if="item.type?.includes('pdf')"
              name="heroicons:document-text-solid"
              class="w-16 h-16 text-red-500"
            />
            <Icon
              v-else-if="item.type?.includes('image')"
              name="heroicons:photo-solid"
              class="w-16 h-16 text-blue-500"
            />
            <Icon
              v-else
              name="heroicons:document-solid"
              class="w-16 h-16 text-gray-500"
            />
          </div>

          <!-- Name -->
          <p class="text-sm font-medium break-all line-clamp-2 w-full">
            {{ item.name }}
          </p>

          <!-- Metadata Badge (optional) -->
          <div
            v-if="!item.isFolder && item.subject"
            class="mt-1 badge badge-xs badge-ghost"
          >
            {{ item.subject }}
          </div>

          <!-- Actions Dropdown (absolute) -->
          <div
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-xs btn-ghost btn-circle bg-base-100 shadow-sm"
                @click.stop
              >
                <Icon name="heroicons:ellipsis-vertical" class="w-4 h-4" />
              </div>
              <ul
                tabindex="0"
                class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-200"
              >
                <li>
                  <a @click.stop="deleteItem(item.id)" class="text-error"
                    >Delete</a
                  >
                </li>
                <li v-if="!item.isFolder && item.url">
                  <a :href="item.url" target="_blank" @click.stop>Download</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Folder Modal -->
    <dialog class="modal" :class="{ 'modal-open': showNewFolderModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Create New Folder</h3>
        <input
          v-model="newFolderName"
          type="text"
          placeholder="Folder Name"
          class="input input-bordered w-full mt-4"
          autofocus
          @keyup.enter="createFolder"
        />
        <div class="modal-action">
          <button class="btn" @click="showNewFolderModal = false">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="createFolder"
            :disabled="!newFolderName"
          >
            Create
          </button>
        </div>
      </div>
    </dialog>

    <!-- Upload Modal -->
    <dialog class="modal" :class="{ 'modal-open': showUploadModal }">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Upload Materials</h3>

        <div class="grid grid-cols-1 gap-4">
          <!-- File Input -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Select Files</span>
            </label>
            <input
              type="file"
              multiple
              class="file-input file-input-bordered w-full"
              @change="(e) => (uploadFiles = e.target.files)"
            />
          </div>

          <!-- Metadata Inputs -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"
                ><span class="label-text">Subject</span></label
              >
              <input
                v-model="uploadMeta.subject"
                type="text"
                class="input input-bordered"
                placeholder="e.g. Math"
              />
            </div>
            <div class="form-control">
              <label class="label"
                ><span class="label-text">Chapter/Unit</span></label
              >
              <input
                v-model="uploadMeta.chapter"
                type="text"
                class="input input-bordered"
                placeholder="e.g. Unit 1"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text">Source/Textbook</span></label
            >
            <input
              v-model="uploadMeta.source"
              type="text"
              class="input input-bordered"
              placeholder="e.g. Pearson"
            />
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text">Hashtags (comma separated)</span></label
            >
            <input
              v-model="uploadMeta.hashtags"
              type="text"
              class="input input-bordered"
              placeholder="e.g. algebra, basics"
            />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showUploadModal = false">Cancel</button>
          <button
            class="btn btn-primary"
            @click="handleUpload"
            :disabled="isUploading || !uploadFiles"
          >
            <span v-if="isUploading" class="loading loading-spinner"></span>
            {{ isUploading ? "Uploading..." : "Upload" }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
