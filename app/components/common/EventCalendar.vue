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

const { data: events, refresh } = await useFetch("/api/common/calendar-events");

const eventModal = ref<HTMLDialogElement | null>(null);
const selectedDateInfo = ref<any>(null);
const editingEventId = ref<string | null>(null);

const eventForm = ref({
  title: "",
  allDay: true,
  startDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "10:00",
});
const errors = ref({
  title: false,
});
const showModal = ref(false);
const isEditing = computed(() => !!editingEventId.value);
const selectedEventId = ref<string | null>(null);

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const handleDateSelect = (selectInfo: DateSelectArg) => {
  selectedDateInfo.value = selectInfo;
  selectedEventId.value = null;
  editingEventId.value = null;

  const startDate = toLocalDateStr(selectInfo.start);
  let endDate: string;
  if (selectInfo.allDay) {
    // FullCalendar all-day end is exclusive, subtract 1 day for display
    const endExclusive = new Date(selectInfo.end);
    endExclusive.setDate(endExclusive.getDate() - 1);
    endDate = toLocalDateStr(endExclusive);
  } else {
    endDate = toLocalDateStr(selectInfo.end);
  }

  eventForm.value = {
    title: "",
    allDay: selectInfo.allDay,
    startDate,
    endDate,
    startTime: "09:00",
    endTime: "10:00",
  };

  if (!selectInfo.allDay) {
    eventForm.value.startTime = selectInfo.start.toTimeString().slice(0, 5);
    eventForm.value.endTime = selectInfo.end.toTimeString().slice(0, 5);
  }

  showModal.value = true;
};

const handleEventClick = (clickInfo: EventClickArg) => {
  const { event } = clickInfo;

  if (event.extendedProps.type !== "personal") {
    return;
  }

  selectedEventId.value = event.id;
  editingEventId.value = event.id;

  const startDate = event.start ? toLocalDateStr(event.start) : "";
  let endDate = startDate;
  if (event.allDay && event.end) {
    // For all-day events, end is exclusive — subtract 1 day for display
    const endExclusive = new Date(event.end);
    endExclusive.setDate(endExclusive.getDate() - 1);
    endDate = toLocalDateStr(endExclusive);
  } else if (!event.allDay && event.end) {
    endDate = toLocalDateStr(event.end);
  }

  eventForm.value = {
    title: event.title,
    allDay: event.allDay,
    startDate,
    endDate,
    startTime: event.start ? event.start.toTimeString().slice(0, 5) : "09:00",
    endTime: "10:00",
  };

  if (event.end && !event.allDay) {
    eventForm.value.endTime = event.end.toTimeString().slice(0, 5);
  } else if (event.start && !event.allDay) {
    const end = new Date(event.start);
    end.setHours(end.getHours() + 1);
    eventForm.value.endTime = end.toTimeString().slice(0, 5);
  }

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  // eventModal.value?.close()
  if (selectedDateInfo.value?.view?.calendar) {
    selectedDateInfo.value.view.calendar.unselect();
  }
  selectedDateInfo.value = null;
  selectedEventId.value = null;
  editingEventId.value = null;
  errors.value.title = false;
};

const handleDelete = async () => {
  if (!selectedEventId.value) return;

  if (!confirm(t("components.common.calendar.confirm_delete"))) return;

  try {
    await $fetch(`/api/common/events/${selectedEventId.value}`, {
      method: "DELETE",
    });

    // Remove from local state
    calendarOptions.value.events = (
      calendarOptions.value.events as any[]
    ).filter((e) => e.id !== selectedEventId.value);

    closeModal();
  } catch (error) {
    console.error("Failed to delete event:", error);
    alert(t("components.common.calendar.failed_delete"));
  }
};

const saveEvent = async () => {
  if (!eventForm.value.title) {
    errors.value.title = true;
    return;
  }

  try {
    let start: string;
    let end: string;

    if (eventForm.value.allDay) {
      start = eventForm.value.startDate;
      // FullCalendar expects exclusive end for all-day events
      const endDate = new Date(eventForm.value.endDate + "T00:00:00");
      endDate.setDate(endDate.getDate() + 1);
      end = toLocalDateStr(endDate);
    } else {
      start = `${eventForm.value.startDate}T${eventForm.value.startTime}`;
      end = `${eventForm.value.endDate}T${eventForm.value.endTime}`;
    }

    const eventData = {
      title: eventForm.value.title,
      start,
      end,
      allDay: eventForm.value.allDay,
      extendedProps: {
        type: "personal",
      },
    };

    if (isEditing.value && selectedEventId.value) {
      // Update existing event
      await $fetch(`/api/common/events/${selectedEventId.value}`, {
        method: "PUT",
        body: eventData,
      });

      // Update local state
      const eventIndex = (calendarOptions.value.events as any[]).findIndex(
        (e) => e.id === selectedEventId.value
      );
      if (eventIndex !== -1) {
        const updatedEvents = [...(calendarOptions.value.events as any[])];
        updatedEvents[eventIndex] = {
          ...updatedEvents[eventIndex],
          ...eventData,
        };
        calendarOptions.value.events = updatedEvents;
      }
    } else {
      // Create new event
      const newEvent = await $fetch("/api/common/events", {
        method: "POST",
        body: eventData,
      });

      // Add to calendar
      calendarOptions.value.events = [
        ...(calendarOptions.value.events as any[]),
        {
          id: newEvent!.id,
          ...eventData,
          backgroundColor: "#3788d8",
          borderColor: "#3788d8",
          editable: true,
        },
      ];
    }

    closeModal();
  } catch (error) {
    console.error("Failed to save event:", error);
    alert(t("components.common.calendar.failed_save"));
  }
};

const handleEventDrop = async (info: EventDropArg) => {
  const { event } = info;

  // Only allow moving personal events
  if (event.extendedProps.type === "homework") {
    info.revert();
    return;
  }

  try {
    await $fetch(`/api/common/events/${event.id}`, {
      method: "PUT",
      body: {
        start: event.start?.toISOString(),
        end: event.end?.toISOString(),
        allDay: event.allDay,
      },
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    info.revert();
    alert(t("components.common.calendar.failed_update"));
  }
};

const handleEventResize = async (info: EventResizeDoneArg) => {
  const { event } = info;

  try {
    await $fetch(`/api/common/events/${event.id}`, {
      method: "PUT",
      body: {
        start: event.start?.toISOString(),
        end: event.end?.toISOString(),
        allDay: event.allDay,
      },
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    info.revert();
    alert(t("components.common.calendar.failed_update"));
  }
};

const handleDateClick = (info: any) => {
  selectedDateInfo.value = null;
  selectedEventId.value = null;
  editingEventId.value = null;
  errors.value.title = false;

  const dateStr = toLocalDateStr(info.date);
  const startTime = info.allDay ? "09:00" : info.date.toTimeString().slice(0, 5);
  const endDate = info.allDay ? dateStr : (() => {
    const end = new Date(info.date);
    end.setHours(end.getHours() + 1);
    return toLocalDateStr(end);
  })();
  const endTime = info.allDay ? "10:00" : (() => {
    const end = new Date(info.date);
    end.setHours(end.getHours() + 1);
    return end.toTimeString().slice(0, 5);
  })();

  eventForm.value = {
    title: "",
    allDay: info.allDay,
    startDate: dateStr,
    endDate,
    startTime,
    endTime,
  };

  showModal.value = true;
};

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  events: events.value as any, // Pass the ref directly so it updates on refresh
  editable: true, // Enable drag and drop
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  dateClick: handleDateClick, // Handle single clicks (especially on mobile)
  selectLongPressDelay: 200, // Reduce delay for touch selection
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  height: "auto", // Let it adapt to container
});

const updateCalendarOptions = () => {
  const isMobile = window.innerWidth < 768;

  calendarOptions.value.headerToolbar = isMobile
    ? {
        left: "prev,next",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }
    : {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      };
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

    <!-- Event Modal -->
    <dialog id="event_modal" class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{
            isEditing
              ? $t("components.common.calendar.modal_title_edit")
              : $t("components.common.calendar.modal_title_create")
          }}
        </h3>

        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">{{
              $t("components.common.calendar.event_title_label")
            }}</span>
          </label>
          <input
            v-model="eventForm.title"
            type="text"
            :placeholder="
              $t('components.common.calendar.event_title_placeholder')
            "
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.title }"
          />
        </div>

        <div class="form-control mb-4">
          <label class="label cursor-pointer justify-start gap-4">
            <span class="label-text">{{
              $t("components.common.calendar.all_day_label")
            }}</span>
            <input
              type="checkbox"
              v-model="eventForm.allDay"
              class="checkbox"
            />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{
                $t("components.common.calendar.start_date_label")
              }}</span>
            </label>
            <input
              v-model="eventForm.startDate"
              type="date"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{
                $t("components.common.calendar.end_date_label")
              }}</span>
            </label>
            <input
              v-model="eventForm.endDate"
              type="date"
              :min="eventForm.startDate"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <div v-if="!eventForm.allDay" class="grid grid-cols-2 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{
                $t("components.common.calendar.start_time_label")
              }}</span>
            </label>
            <input
              v-model="eventForm.startTime"
              type="time"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{
                $t("components.common.calendar.end_time_label")
              }}</span>
            </label>
            <input
              v-model="eventForm.endTime"
              type="time"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <div class="modal-action justify-between">
          <div>
            <button
              v-if="isEditing"
              class="btn btn-error btn-outline"
              @click="handleDelete"
            >
              {{ $t("components.common.calendar.delete") }}
            </button>
          </div>
          <div class="flex gap-2">
            <button class="btn" @click="closeModal">
              {{ $t("components.common.calendar.cancel") }}
            </button>
            <button class="btn btn-primary" @click="saveEvent">
              {{
                isEditing
                  ? $t("components.common.calendar.save")
                  : $t("components.common.calendar.create")
              }}
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

<style>
.fc-daisy {
  --fc-border-color: oklch(var(--b3));
  --fc-button-text-color: oklch(var(--pc));
  --fc-button-bg-color: oklch(var(--p));
  --fc-button-border-color: oklch(var(--p));
  --fc-button-hover-bg-color: oklch(var(--s));
  --fc-button-hover-border-color: oklch(var(--s));
  --fc-button-active-bg-color: oklch(var(--s));
  --fc-button-active-border-color: oklch(var(--s));

  --fc-event-bg-color: oklch(var(--a));
  --fc-event-border-color: oklch(var(--a));
  --fc-event-text-color: oklch(var(--ac));

  --fc-today-bg-color: oklch(var(--b2));
  --fc-page-bg-color: oklch(var(--b1));
  --fc-neutral-bg-color: oklch(var(--b2));
  --fc-list-event-hover-bg-color: oklch(var(--b2));
}

/* Round the buttons to match DaisyUI */
.fc-daisy .fc-button {
  border-radius: var(--rounded-btn, 0.5rem);
  text-transform: uppercase;
  font-weight: bold;
}

/* Remove default shadows/outlines if needed */
.fc-daisy .fc-button:focus {
  box-shadow: none;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .fc-daisy .fc-toolbar-title {
    font-size: 1.25rem; /* Smaller title */
  }

  .fc-daisy .fc-button {
    padding: 0.2rem 0.5rem; /* Smaller buttons */
    font-size: 0.875rem;
  }

  .fc-daisy .fc-toolbar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .fc-daisy .fc-toolbar-chunk {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}
</style>
