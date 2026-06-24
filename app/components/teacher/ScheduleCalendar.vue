<script setup lang="ts">
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
  EventDropArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";

const { t } = useI18n();

interface ScheduleEvent {
  id: string;
  teacherId: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

const { data: scheduleEvents, refresh } = await useFetch<ScheduleEvent[]>(
  "/api/teacher/schedule"
);

const showModal = ref(false);
const editingEventId = ref<string | null>(null);
const isEditing = computed(() => !!editingEventId.value);

const eventForm = ref({
  description: "",
  startTime: "",
  endTime: "",
  isAvailable: true,
});
const formError = ref("");

function toFcEvents(events: ScheduleEvent[] | null | undefined) {
  if (!events) return [];
  return events.map((e) => ({
    id: e.id,
    title: e.isAvailable
      ? t("teacher.schedule.event.available")
      : t("teacher.schedule.event.booked"),
    start: e.startTime,
    end: e.endTime,
    backgroundColor: e.isAvailable ? "#22c55e" : "#9ca3af",
    borderColor: e.isAvailable ? "#16a34a" : "#6b7280",
    editable: true,
    extendedProps: {
      description: e.description,
      isAvailable: e.isAvailable,
    },
  }));
}

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: "timeGridWeek",
  timeZone: "local",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  events: toFcEvents(scheduleEvents.value),
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  slotMinTime: "06:00:00",
  slotMaxTime: "22:00:00",
  select: handleDateSelect,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  selectLongPressDelay: 200,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  height: "auto",
});

watch(scheduleEvents, (val) => {
  calendarOptions.value.events = toFcEvents(val);
});

function resetForm(start?: Date, end?: Date) {
  eventForm.value = {
    description: "",
    startTime: start
      ? toDateTimeLocal(start)
      : "",
    endTime: end
      ? toDateTimeLocal(end)
      : "",
    isAvailable: true,
  };
  formError.value = "";
  editingEventId.value = null;
}

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function handleDateSelect(selectInfo: DateSelectArg) {
  resetForm(selectInfo.start, selectInfo.end);
  if (selectInfo.allDay) {
    const start = new Date(selectInfo.start);
    start.setHours(9, 0, 0, 0);
    const end = new Date(selectInfo.start);
    end.setHours(10, 0, 0, 0);
    eventForm.value.startTime = toDateTimeLocal(start);
    eventForm.value.endTime = toDateTimeLocal(end);
  }
  showModal.value = true;
}

function handleDateClick(info: any) {
  const start = new Date(info.date);
  const end = new Date(info.date);
  if (info.allDay) {
    start.setHours(9, 0, 0, 0);
    end.setHours(10, 0, 0, 0);
  } else {
    end.setHours(end.getHours() + 1);
  }
  resetForm(start, end);
  showModal.value = true;
}

function handleEventClick(clickInfo: EventClickArg) {
  const { event } = clickInfo;
  editingEventId.value = event.id;

  const start = event.start || new Date();
  const end = event.end || new Date(start.getTime() + 3600000);

  eventForm.value = {
    description: event.extendedProps.description || "",
    startTime: toDateTimeLocal(start),
    endTime: toDateTimeLocal(end),
    isAvailable: event.extendedProps.isAvailable ?? true,
  };
  formError.value = "";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingEventId.value = null;
  formError.value = "";
}

async function saveEvent() {
  formError.value = "";

  if (!eventForm.value.startTime || !eventForm.value.endTime) {
    formError.value = t("teacher.schedule.form.error_time_required");
    return;
  }

  const start = new Date(eventForm.value.startTime);
  const end = new Date(eventForm.value.endTime);
  if (start >= end) {
    formError.value = t("teacher.schedule.form.error_time_order");
    return;
  }

  try {
    const body = {
      description: eventForm.value.description.trim() || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAvailable: eventForm.value.isAvailable,
    };

    if (isEditing.value && editingEventId.value) {
      await $fetch(`/api/teacher/schedule/${editingEventId.value}`, {
        method: "PUT",
        body,
      });
    } else {
      await $fetch("/api/teacher/schedule", {
        method: "POST",
        body,
      });
    }

    await refresh();
    closeModal();
  } catch (error) {
    console.error("Failed to save event:", error);
    formError.value = t("teacher.schedule.form.error_save_failed");
  }
}

async function handleDelete() {
  if (!editingEventId.value) return;
  if (!confirm(t("teacher.schedule.event.confirm_delete"))) return;

  try {
    await $fetch(`/api/teacher/schedule/${editingEventId.value}`, {
      method: "DELETE",
    });
    await refresh();
    closeModal();
  } catch (error) {
    console.error("Failed to delete event:", error);
    formError.value = t("teacher.schedule.form.error_delete_failed");
  }
}

async function handleEventDrop(info: EventDropArg) {
  const { event } = info;
  try {
    await $fetch(`/api/teacher/schedule/${event.id}`, {
      method: "PUT",
      body: {
        startTime: event.start?.toISOString(),
        endTime: event.end?.toISOString(),
      },
    });
    await refresh();
  } catch (error) {
    console.error("Failed to update event:", error);
    info.revert();
  }
}

async function handleEventResize(info: EventResizeDoneArg) {
  const { event } = info;
  try {
    await $fetch(`/api/teacher/schedule/${event.id}`, {
      method: "PUT",
      body: {
        startTime: event.start?.toISOString(),
        endTime: event.end?.toISOString(),
      },
    });
    await refresh();
  } catch (error) {
    console.error("Failed to update event:", error);
    info.revert();
  }
}

const updateCalendarOptions = () => {
  const isMobile = window.innerWidth < 768;
  calendarOptions.value.headerToolbar = isMobile
    ? { left: "prev,next", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" };
};

onMounted(() => {
  updateCalendarOptions();
  window.addEventListener("resize", updateCalendarOptions);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateCalendarOptions);
});
</script>

<template>
  <div class="bg-base-100 p-4 rounded-lg shadow">
    <FullCalendar :options="calendarOptions" class="fc-daisy" />

    <!-- Schedule Event Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          {{
            isEditing
              ? $t("teacher.schedule.modal_edit")
              : $t("teacher.schedule.modal_create")
          }}
        </h3>

        <!-- Description -->
        <div class="form-control w-full mb-3">
          <label class="label">
            <span class="label-text">{{ $t("teacher.schedule.form.description_label") }}</span>
          </label>
          <textarea
            v-model="eventForm.description"
            :placeholder="$t('teacher.schedule.form.description_placeholder')"
            class="textarea textarea-bordered w-full"
            rows="3"
          />
        </div>

        <!-- Start / End time -->
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ $t("teacher.schedule.form.start_time") }}</span>
            </label>
            <input
              v-model="eventForm.startTime"
              type="datetime-local"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ $t("teacher.schedule.form.end_time") }}</span>
            </label>
            <input
              v-model="eventForm.endTime"
              type="datetime-local"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <!-- Available toggle -->
        <div class="form-control mb-4">
          <label class="label cursor-pointer justify-start gap-4">
            <span class="label-text">{{ $t("teacher.schedule.form.mark_available") }}</span>
            <input
              v-model="eventForm.isAvailable"
              type="checkbox"
              class="toggle toggle-success"
            />
          </label>
        </div>

        <!-- Error message -->
        <div v-if="formError" class="alert alert-error mb-4">
          <span>{{ formError }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-action justify-between">
          <div>
            <button
              v-if="isEditing"
              class="btn btn-error btn-outline"
              @click="handleDelete"
            >
              {{ $t("teacher.schedule.event.delete") }}
            </button>
          </div>
          <div class="flex gap-2">
            <button class="btn" @click="closeModal">
              {{ $t("teacher.schedule.form.cancel") }}
            </button>
            <button class="btn btn-primary" @click="saveEvent">
              {{ $t("teacher.schedule.form.save") }}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>
  </div>
</template>
