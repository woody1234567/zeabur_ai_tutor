<script setup lang="ts">
const props = defineProps<{
  material: {
    id: string;
    name: string;
    type?: string;
    url?: string;
    subject?: string;
    className?: string;
    classroomId?: string;
    isFolder?: boolean;
    sharedAt?: string;
  };
}>();

const localePath = useLocalePath();

function handleClick() {
  if (props.material.isFolder) {
    if (props.material.classroomId) {
      navigateTo(
        localePath(`/student/classrooms/${props.material.classroomId}`)
      );
    }
  } else if (props.material.url) {
    window.open(props.material.url, "_blank");
  }
}
</script>

<template>
  <div
    class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-200"
    @click="handleClick"
  >
    <div class="card-body p-3 flex flex-row items-center gap-3">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <Icon
          v-if="material.isFolder"
          name="heroicons:folder-solid"
          class="w-10 h-10 text-yellow-500"
        />
        <Icon
          v-else-if="material.type?.includes('pdf')"
          name="heroicons:document-text-solid"
          class="w-10 h-10 text-red-500"
        />
        <Icon
          v-else-if="material.type?.includes('image')"
          name="heroicons:photo-solid"
          class="w-10 h-10 text-blue-500"
        />
        <Icon
          v-else
          name="heroicons:document-solid"
          class="w-10 h-10 text-gray-500"
        />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 text-left">
        <h3 class="font-medium text-sm truncate" :title="material.name">
          {{ material.name }}
        </h3>
        <p class="text-xs text-base-content/60 truncate">
          {{ material.className }}
          <span v-if="material.subject"> • {{ material.subject }}</span>
        </p>
      </div>

      <!-- Action Icon -->
      <div class="text-base-content/30">
        <Icon name="heroicons:chevron-right" class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
