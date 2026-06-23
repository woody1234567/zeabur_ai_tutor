<script setup lang="ts">
definePageMeta({
  layout: "student",
});

const { t } = useI18n();
const localePath = useLocalePath();

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

const {
  data: bookingsData,
  refresh: refreshBookings,
} = await useFetch<BookingItem[]>("/api/student/bookings");

const cancellingId = ref<string | null>(null);

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
  <div class="p-4 md:p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ t("student.dashboard.title") }}</h1>
      <NuxtLink
        :to="localePath('/student/calendar-help')"
        class="btn btn-circle btn-ghost"
        :title="t('student.dashboard.calendar_help')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </NuxtLink>
    </div>

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

    <LazyCommonEventCalendar />
  </div>
</template>
