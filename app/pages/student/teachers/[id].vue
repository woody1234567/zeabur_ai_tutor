<script setup lang="ts">
definePageMeta({ layout: "student" });

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const teacherId = String(route.params.id);

interface TeacherProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxStudents: number | null;
}

interface AvailableResponse {
  teacher: TeacherProfile;
  availableSlots: ScheduleEvent[];
}

const { data, status, error, refresh } = await useFetch<AvailableResponse>(
  `/api/student/teachers/${teacherId}/available`,
);

const showBookingModal = ref(false);
const selectedSlot = ref<ScheduleEvent | null>(null);
const bookingNote = ref("");
const bookingLoading = ref(false);
const bookingError = ref("");

function openBookingModal(slot: ScheduleEvent) {
  selectedSlot.value = slot;
  bookingNote.value = "";
  bookingError.value = "";
  showBookingModal.value = true;
}

async function confirmBooking() {
  if (!selectedSlot.value) return;

  bookingLoading.value = true;
  bookingError.value = "";

  try {
    await $fetch("/api/student/bookings", {
      method: "POST",
      body: {
        availabilityId: selectedSlot.value.id,
        studentNote: bookingNote.value || undefined,
      },
    });
    showBookingModal.value = false;
    await refresh();
  } catch (err: any) {
    bookingError.value =
      err.data?.statusMessage || t("student.teachers.booking_modal.error");
  } finally {
    bookingLoading.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <NuxtLink
      :to="localePath('/student/teachers')"
      class="btn btn-ghost btn-sm mb-6"
    >
      <Icon name="heroicons-outline:arrow-left" class="h-4 w-4" />
      {{ t("student.teachers.back") }}
    </NuxtLink>

    <!-- Loading -->
    <div
      v-if="status === 'pending'"
      class="flex items-center justify-center gap-3 py-16"
    >
      <span class="loading loading-spinner loading-md"></span>
      <span class="opacity-70">{{ t("student.teachers.loading") }}</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <span>{{
        error.data?.message || t("student.teachers.load_error")
      }}</span>
    </div>

    <!-- Content -->
    <div v-else-if="data" class="space-y-8">
      <!-- Teacher header -->
      <div>
        <h1 class="text-3xl font-bold">
          {{ data.teacher.name || "Teacher" }}
        </h1>
        <p class="text-sm opacity-70">{{ data.teacher.email }}</p>
      </div>

      <!-- Available slots -->
      <section class="space-y-4">
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-semibold">
              {{ t("student.teachers.available_slots") }}
            </h2>
            <p class="text-sm opacity-70">
              {{ t("student.teachers.slots_description") }}
            </p>
          </div>
          <span class="badge badge-success">
            {{
              t("student.teachers.available_count", {
                count: data.availableSlots.length,
              })
            }}
          </span>
        </div>

        <div v-if="data.availableSlots.length === 0" class="alert">
          <span>{{ t("student.teachers.no_slots") }}</span>
        </div>

        <div v-else class="grid gap-4">
          <TeacherScheduleEventCard
            v-for="slot in data.availableSlots"
            :key="slot.id"
            :event="slot"
            :show-book-button="true"
            @book="openBookingModal(slot)"
          />
        </div>
      </section>
    </div>

    <!-- Booking Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showBookingModal }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ t("student.teachers.booking_modal.title") }}
        </h3>

        <div v-if="selectedSlot" class="mt-4 space-y-3">
          <div class="rounded-lg bg-base-200 p-3">
            <p class="font-semibold">{{ selectedSlot.title }}</p>
            <p v-if="selectedSlot.description" class="text-sm opacity-70">
              {{ selectedSlot.description }}
            </p>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">{{
                t("student.teachers.booking_modal.note_label")
              }}</span>
            </label>
            <textarea
              v-model="bookingNote"
              class="textarea textarea-bordered"
              :placeholder="
                t('student.teachers.booking_modal.note_placeholder')
              "
              rows="3"
            ></textarea>
          </div>

          <div v-if="bookingError" class="alert alert-error text-sm">
            <span>{{ bookingError }}</span>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            :disabled="bookingLoading"
            @click="showBookingModal = false"
          >
            {{ t("student.teachers.booking_modal.cancel") }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="bookingLoading"
            @click="confirmBooking"
          >
            <span
              v-if="bookingLoading"
              class="loading loading-spinner loading-sm"
            ></span>
            {{ t("student.teachers.booking_modal.confirm") }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showBookingModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
