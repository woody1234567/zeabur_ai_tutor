<script setup lang="ts">
import type { PropType } from "vue";

interface Student {
  id: string;
  name: string;
  image?: string | null;
  email?: string;
}

interface Post {
  id: string;
  content: string | null;
  classDate: string | null;
  classStartTime: string | null;
  classEndTime: string | null;
  classLength: number | null;
  attendees: string[] | null;
  createdAt: string;
}

const props = defineProps({
  post: {
    type: Object as PropType<Post>,
    required: true,
  },
  students: {
    type: Array as PropType<Student[]>,
    default: () => [],
  },
  editable: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const localePath = useLocalePath();
const classroomId = route.params.id as string;

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const attendeeNames = computed(() => {
  if (!props.post.attendees || !props.students) return [];
  return props.post.attendees
    .map((id) => props.students.find((s) => s.id === id)?.name)
    .filter((name): name is string => !!name);
});
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-300">
    <div class="card-body p-4 sm:p-6">
      <!-- Header: Date and Time -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-2">
        <div class="flex-1">
          <div class="flex justify-between items-center">
            <h3 class="card-title text-lg font-bold">
              {{ post.classDate || $t("components.common.posts_card.no_date") }}
            </h3>
            <!-- Edit Button -->
            <NuxtLink
              v-if="editable"
              :to="
                localePath({
                  path: `/teacher/classrooms/${classroomId}/post/edit`,
                  query: { postId: post.id },
                })
              "
              class="btn btn-ghost btn-xs text-info"
            >
              <Icon name="heroicons:pencil-square" class="size-4 mr-1" />
              {{ $t("components.common.posts_card.edit") }}
            </NuxtLink>
          </div>
          <div
            class="flex flex-wrap items-center gap-2 text-sm opacity-80 mt-1"
          >
            <Icon name="heroicons-outline:clock" class="w-4 h-4" />
            <span v-if="post.classStartTime && post.classEndTime">
              {{ post.classStartTime }} - {{ post.classEndTime }}
            </span>
            <span v-else>{{ $t("components.common.posts_card.no_time") }}</span>

            <span
              v-if="post.classLength"
              class="badge badge-sm badge-ghost ml-1"
            >
              {{ formatDuration(post.classLength) }}
            </span>
          </div>
        </div>
        <!-- Created At -->
        <div class="text-xs opacity-50 whitespace-nowrap">
          {{ $t("components.common.posts_card.included") }}:
          {{ formatDate(post.createdAt) }}
        </div>
      </div>

      <div class="divider my-2"></div>

      <!-- Attendees -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <span class="text-sm font-semibold opacity-70">
          {{ $t("components.common.posts_card.attendees") }}:
        </span>
        <template v-if="attendeeNames.length > 0">
          <div
            v-for="name in attendeeNames"
            :key="name"
            class="badge badge-outline badge-sm"
          >
            {{ name }}
          </div>
        </template>
        <span v-else class="text-sm opacity-50 italic">
          {{ $t("components.common.posts_card.no_attendees") }}
        </span>
      </div>

      <!-- Content -->
      <div class="whitespace-pre-wrap text-base leading-relaxed">
        {{ post.content }}
      </div>
    </div>
  </div>
</template>
