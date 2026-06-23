<script setup lang="ts">
definePageMeta({ layout: "teacher" });

const { t } = useI18n();

interface BookingItem {
  id: string;
  status: string;
  studentNote: string | null;
  teacherNote: string | null;
  createdAt: string;
  updatedAt: string;
  availabilityId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  slotTitle: string;
  slotDescription: string | null;
  slotStartTime: string;
  slotEndTime: string;
}

const {
  data: pendingBookings,
  refresh: refreshBookings,
} = await useFetch<BookingItem[]>("/api/teacher/bookings", {
  query: { status: "pending" },
});

const actionBooking = ref<BookingItem | null>(null);
const actionType = ref<"confirm" | "reject">("confirm");
const actionNote = ref("");
const actionLoading = ref(false);
const showActionModal = ref(false);
const scheduleCalendarRef = ref<{ refreshEvents?: () => void } | null>(null);

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

function openAction(booking: BookingItem, type: "confirm" | "reject") {
  actionBooking.value = booking;
  actionType.value = type;
  actionNote.value = "";
  showActionModal.value = true;
}

async function submitAction() {
  if (!actionBooking.value) return;

  actionLoading.value = true;
  try {
    await $fetch(
      `/api/teacher/bookings/${actionBooking.value.id}/${actionType.value}`,
      {
        method: "PUT",
        body: { teacherNote: actionNote.value || undefined },
      },
    );
    showActionModal.value = false;
    await refreshBookings();
    scheduleCalendarRef.value?.refreshEvents?.();
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">{{ t("teacher.schedule.title") }}</h1>
        <p class="text-sm opacity-70 mt-1">
          {{ t("teacher.schedule.description") }}
        </p>
      </div>
    </div>

    <!-- Pending Bookings Section -->
    <section v-if="pendingBookings && pendingBookings.length > 0" class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xl font-semibold">
          {{ t("teacher.bookings.title") }}
        </h2>
        <span class="badge badge-warning">{{ pendingBookings.length }}</span>
      </div>

      <div class="grid gap-3">
        <div
          v-for="booking in pendingBookings"
          :key="booking.id"
          class="card bg-base-100 shadow border-l-4 border-warning"
        >
          <div class="card-body p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold">{{ booking.slotTitle }}</h3>
                  <span class="badge badge-warning badge-sm">
                    {{ t("student.bookings.status_pending") }}
                  </span>
                </div>
                <p class="text-sm opacity-70">
                  {{ t("teacher.bookings.from_student", { name: booking.studentName || booking.studentEmail }) }}
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
                  v-if="booking.studentNote"
                  class="mt-2 text-sm italic opacity-70"
                >
                  {{ t("teacher.bookings.student_note") }}: {{ booking.studentNote }}
                </p>
              </div>
              <div class="flex gap-2 shrink-0">
                <button
                  class="btn btn-success btn-sm"
                  @click="openAction(booking, 'confirm')"
                >
                  {{ t("teacher.bookings.confirm") }}
                </button>
                <button
                  class="btn btn-outline btn-error btn-sm"
                  @click="openAction(booking, 'reject')"
                >
                  {{ t("teacher.bookings.reject") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <TeacherScheduleCalendar ref="scheduleCalendarRef" />

    <!-- Action Modal (Confirm/Reject) -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showActionModal }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{
            actionType === "confirm"
              ? t("teacher.bookings.confirm")
              : t("teacher.bookings.reject")
          }}
        </h3>

        <div v-if="actionBooking" class="mt-4 space-y-3">
          <div class="rounded-lg bg-base-200 p-3">
            <p class="font-semibold">{{ actionBooking.slotTitle }}</p>
            <p class="text-sm opacity-70">
              {{ t("teacher.bookings.from_student", { name: actionBooking.studentName || actionBooking.studentEmail }) }}
            </p>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ t("teacher.bookings.note_label") }}</span>
            </label>
            <textarea
              v-model="actionNote"
              class="textarea textarea-bordered"
              :placeholder="t('teacher.bookings.note_placeholder')"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            :disabled="actionLoading"
            @click="showActionModal = false"
          >
            {{ t("student.teachers.booking_modal.cancel") }}
          </button>
          <button
            class="btn"
            :class="actionType === 'confirm' ? 'btn-success' : 'btn-error'"
            :disabled="actionLoading"
            @click="submitAction"
          >
            <span
              v-if="actionLoading"
              class="loading loading-spinner loading-sm"
            ></span>
            {{
              actionType === "confirm"
                ? t("teacher.bookings.confirm")
                : t("teacher.bookings.reject")
            }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showActionModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
