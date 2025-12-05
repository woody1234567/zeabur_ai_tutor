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
  EventResizeDoneArg,
} from "@fullcalendar/core";

const { t } = useI18n();

const { data: events, refresh } = await useFetch("/api/common/calendar-events");

const eventModal = ref<HTMLDialogElement | null>(null);
const newEventTitle = ref("");
const selectedDateInfo = ref<any>(null);
const isAllDay = ref(true);
const startTime = ref("09:00");
const endTime = ref("10:00");
const editingEventId = ref<string | null>(null);

// Form state for better handling
const eventForm = ref({
  title: "",
  allDay: true,
  startTime: "09:00",
  endTime: "10:00",
  startStr: "",
  endStr: "",
});
const errors = ref({
  title: false,
});
const showModal = ref(false);
const isEditing = computed(() => !!editingEventId.value);
const selectedEventId = ref<string | null>(null);

const handleDateSelect = (selectInfo: DateSelectArg) => {
  selectedDateInfo.value = selectInfo;
  selectedEventId.value = null;
  editingEventId.value = null;

  // Reset form
  eventForm.value = {
    title: "",
    allDay: selectInfo.allDay,
    startTime: "09:00",
    endTime: "10:00",
    startStr: selectInfo.startStr,
    endStr: selectInfo.endStr,
  };

  if (!selectInfo.allDay && selectInfo.startStr.includes("T")) {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    eventForm.value.startTime = start.toTimeString().slice(0, 5);
    eventForm.value.endTime = end.toTimeString().slice(0, 5);
  }

  showModal.value = true;
  // eventModal.value?.showModal()
};

const handleEventClick = (clickInfo: EventClickArg) => {
  const { event } = clickInfo;

  // Only allow editing personal events
  if (event.extendedProps.type !== "personal") {
    return;
  }

  selectedEventId.value = event.id;
  editingEventId.value = event.id;

  eventForm.value = {
    title: event.title,
    allDay: event.allDay,
    startTime: "09:00",
    endTime: "10:00",
    startStr: event.startStr,
    endStr: event.endStr || event.startStr,
  };

  if (event.start) {
    eventForm.value.startTime = event.start.toTimeString().slice(0, 5);
  }
  if (event.end) {
    eventForm.value.endTime = event.end.toTimeString().slice(0, 5);
  } else if (event.start) {
    const end = new Date(event.start);
    end.setHours(end.getHours() + 1);
    eventForm.value.endTime = end.toTimeString().slice(0, 5);
  }

  showModal.value = true;
  // eventModal.value?.showModal()
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
    await $fetch(`/api/student/events/${selectedEventId.value}`, {
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
    const eventData = {
      title: eventForm.value.title,
      start: eventForm.value.startStr,
      end: eventForm.value.endStr,
      allDay: eventForm.value.allDay,
      extendedProps: {
        type: "personal",
      },
    };

    // Adjust times if not all day
    if (
      !eventForm.value.allDay &&
      eventForm.value.startTime &&
      eventForm.value.endTime
    ) {
      const baseDate = eventForm.value.startStr.split("T")[0];
      eventData.start = `${baseDate}T${eventForm.value.startTime}`;
      eventData.end = `${baseDate}T${eventForm.value.endTime}`;
    }

    if (isEditing.value && selectedEventId.value) {
      // Update existing event
      await $fetch(`/api/student/events/${selectedEventId.value}`, {
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
      const newEvent = await $fetch("/api/student/events", {
        method: "POST",
        body: eventData,
      });

      // Add to calendar
      calendarOptions.value.events = [
        ...(calendarOptions.value.events as any[]),
        {
          id: newEvent.id,
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
    await $fetch(`/api/student/events/${event.id}`, {
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
    await $fetch(`/api/student/events/${event.id}`, {
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
  // Adapt dateClick info to selectInfo format
  let endStr = info.dateStr;
  if (info.allDay) {
    const endDate = new Date(info.date);
    endDate.setDate(endDate.getDate() + 1);
    endStr = endDate.toISOString().split("T")[0];
  }

  const selectInfo = {
    start: info.date,
    end: info.date, // Approximation
    startStr: info.dateStr,
    endStr: endStr,
    allDay: info.allDay,
    view: info.view,
    jsEvent: info.jsEvent,
  } as unknown as DateSelectArg;

  handleDateSelect(selectInfo);
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
