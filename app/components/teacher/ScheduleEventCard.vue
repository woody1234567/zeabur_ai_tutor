<script setup lang="ts">
interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxStudents: number | null;
}

const props = defineProps<{
  event: ScheduleEvent;
  showBookButton?: boolean;
}>();

const emit = defineEmits<{
  (e: "book"): void;
}>();

const { t } = useI18n();

const availabilityClass = computed(() =>
  props.event.isAvailable ? "border-success" : "border-error"
);
const badgeClass = computed(() =>
  props.event.isAvailable ? "badge-success" : "badge-error"
);

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}
</script>

<template>
  <div
    class="card bg-base-100 shadow border-l-4"
    :class="availabilityClass"
  >
    <div class="card-body p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start gap-2">
            <h3 class="min-w-0 flex-1 truncate text-base font-semibold">
              {{ event.title }}
            </h3>
            <span class="badge" :class="badgeClass">
              {{
                event.isAvailable
                  ? t("student.teachers.available")
                  : t("student.teachers.booked")
              }}
            </span>
          </div>

          <p v-if="event.description" class="mt-1 text-sm opacity-70">
            {{ event.description }}
          </p>

          <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm opacity-70">
            <span class="inline-flex items-center gap-1.5">
              <Icon name="heroicons-outline:calendar" class="h-4 w-4" />
              {{ formatDate(event.startTime) }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Icon name="heroicons-outline:clock" class="h-4 w-4" />
              {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
            </span>
          </div>

          <div class="mt-3">
            <span class="badge badge-info badge-outline">
              {{ t("student.teachers.max_students", { count: event.maxStudents ?? 1 }) }}
            </span>
          </div>
        </div>

        <button
          v-if="showBookButton && event.isAvailable"
          class="btn btn-primary btn-sm shrink-0 self-start"
          @click="emit('book')"
        >
          {{ t("student.teachers.book") }}
        </button>
      </div>
    </div>
  </div>
</template>
