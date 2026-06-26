<script setup lang="ts">
definePageMeta({ layout: "student" });

const { t } = useI18n();
const localePath = useLocalePath();

interface TeacherSummary {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  teachingAreas: string | null;
}

interface BookingItem {
  id: string;
  status: string;
  studentNote: string | null;
  teacherNote: string | null;
  createdAt: string;
  updatedAt: string;
  availabilityId: string;
  teacherId: string;
  teacherName: string | null;
  slotTitle: string;
  slotDescription: string | null;
  slotStartTime: string;
  slotEndTime: string;
}

const { data: teachers, status } = await useFetch<TeacherSummary[]>(
  "/api/student/teachers"
);

const {
  data: bookingsData,
  refresh: refreshBookings,
} = await useFetch<BookingItem[]>("/api/student/bookings");

const cancellingId = ref<string | null>(null);

const sortedTeachers = computed(() =>
  [...(teachers.value || [])].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email)
  )
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

function statusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "badge-warning";
    case "confirmed":
      return "badge-success";
    case "rejected":
      return "badge-error";
    case "cancelled":
      return "badge-ghost";
    default:
      return "";
  }
}

function statusLabel(status: string) {
  const key = `student.bookings.status_${status}` as const;
  return t(key);
}

async function cancelBooking(id: string) {
  if (!confirm(t("student.bookings.cancel_confirm"))) return;

  cancellingId.value = id;
  try {
    await $fetch(`/api/student/bookings/${id}`, { method: "DELETE" });
    await refreshBookings();
  } finally {
    cancellingId.value = null;
  }
}
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <!-- My Bookings Section -->
    <section
      v-if="bookingsData && bookingsData.length > 0"
      class="mb-8 space-y-4"
    >
      <h2 class="text-xl font-semibold">
        {{ t("student.bookings.title") }}
      </h2>

      <div class="grid gap-3">
        <div
          v-for="booking in bookingsData"
          :key="booking.id"
          class="card bg-base-100 shadow border-l-4"
          :class="{
            'border-warning': booking.status === 'pending',
            'border-success': booking.status === 'confirmed',
            'border-error': booking.status === 'rejected',
            'border-base-300': booking.status === 'cancelled',
          }"
        >
          <div class="card-body p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold">{{ booking.slotTitle }}</h3>
                  <span class="badge badge-sm" :class="statusBadgeClass(booking.status)">
                    {{ statusLabel(booking.status) }}
                  </span>
                </div>
                <p class="text-sm opacity-70">
                  {{ t("student.bookings.with_teacher", { name: booking.teacherName || "Teacher" }) }}
                </p>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-70">
                  <span class="inline-flex items-center gap-1">
                    <Icon name="heroicons-outline:calendar" class="h-4 w-4" />
                    {{ formatDate(booking.slotStartTime) }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <Icon name="heroicons-outline:clock" class="h-4 w-4" />
                    {{ formatTime(booking.slotStartTime) }} - {{ formatTime(booking.slotEndTime) }}
                  </span>
                </div>
                <p
                  v-if="booking.teacherNote"
                  class="mt-2 text-sm italic opacity-70"
                >
                  {{ t("student.bookings.teacher_note") }}: {{ booking.teacherNote }}
                </p>
              </div>
              <button
                v-if="booking.status === 'pending'"
                class="btn btn-outline btn-error btn-sm shrink-0"
                :disabled="cancellingId === booking.id"
                @click="cancelBooking(booking.id)"
              >
                <span
                  v-if="cancellingId === booking.id"
                  class="loading loading-spinner loading-xs"
                ></span>
                {{ t("student.bookings.cancel") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">{{ t("student.teachers.title") }}</h1>
        <p class="text-sm opacity-70 mt-1">
          {{ t("student.teachers.description") }}
        </p>
      </div>
      <span class="badge badge-neutral">
        {{ t("student.teachers.count", { count: sortedTeachers.length }) }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="flex items-center justify-center gap-3 py-16">
      <span class="loading loading-spinner loading-md"></span>
      <span class="opacity-70">{{ t("student.teachers.loading") }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="sortedTeachers.length === 0" class="alert">
      <span>{{ t("student.teachers.no_teachers") }}</span>
    </div>

    <!-- Teacher grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="teacher in sortedTeachers"
        :key="teacher.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div class="avatar placeholder">
              <div
                class="bg-neutral text-neutral-content rounded-full w-12 h-12"
              >
                <span v-if="teacher.image">
                  <img :src="teacher.image" :alt="teacher.name || teacher.email" class="rounded-full" />
                </span>
                <span v-else class="text-lg">
                  {{ (teacher.name || teacher.email).slice(0, 1).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold truncate">
                {{ teacher.name || "Teacher" }}
              </h3>
              <p class="text-sm opacity-70 truncate">{{ teacher.email }}</p>
            </div>
          </div>

          <p
            v-if="teacher.bio"
            class="text-sm opacity-70 mt-2 line-clamp-2"
          >
            {{ teacher.bio }}
          </p>

          <div v-if="teacher.teachingAreas" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="area in teacher.teachingAreas.split(',').map(s => s.trim()).filter(Boolean)"
              :key="area"
              class="badge badge-outline badge-sm"
            >
              {{ area }}
            </span>
          </div>

          <div class="card-actions justify-end mt-4">
            <NuxtLink
              :to="localePath(`/student/reservation/${teacher.id}`)"
              class="btn btn-primary btn-sm"
            >
              {{ t("student.teachers.view_availability") }}
              <Icon name="heroicons-outline:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
