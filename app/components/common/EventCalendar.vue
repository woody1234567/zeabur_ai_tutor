<script setup lang="ts">
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

const { data: events, refresh } = await useFetch("/api/common/calendar-events");

const eventModal = ref<HTMLDialogElement | null>(null);
const newEventTitle = ref("");
const selectedDateInfo = ref<any>(null);
const isAllDay = ref(true);
const startTime = ref("09:00");
const endTime = ref("10:00");
const editingEventId = ref<string | null>(null);

const handleDateSelect = (selectInfo: any) => {
  selectedDateInfo.value = selectInfo;
  newEventTitle.value = "";
  isAllDay.value = selectInfo.allDay;
  editingEventId.value = null; // Reset editing state

  // Set default times if not all day
  if (!selectInfo.allDay && selectInfo.startStr.includes("T")) {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    startTime.value = start.toTimeString().slice(0, 5);
    endTime.value = end.toTimeString().slice(0, 5);
  } else {
    startTime.value = "09:00";
    endTime.value = "10:00";
  }

  eventModal.value?.showModal();
};

const handleEventClick = (clickInfo: any) => {
  const { event } = clickInfo;

  // Only allow editing personal events
  if (event.extendedProps.type !== "personal") {
    return;
  }

  editingEventId.value = event.id;
  newEventTitle.value = event.title;
  isAllDay.value = event.allDay;

  // Set times
  if (event.start) {
    startTime.value = event.start.toTimeString().slice(0, 5);
  }
  if (event.end) {
    endTime.value = event.end.toTimeString().slice(0, 5);
  } else if (event.start) {
    // If no end time, default to 1 hour after start
    const end = new Date(event.start);
    end.setHours(end.getHours() + 1);
    endTime.value = end.toTimeString().slice(0, 5);
  }

  // Mock selectedDateInfo for save logic
  selectedDateInfo.value = {
    startStr: event.startStr,
    endStr: event.endStr || event.startStr, // Fallback
    view: clickInfo.view,
  };

  eventModal.value?.showModal();
};

const closeModal = () => {
  eventModal.value?.close();
  if (selectedDateInfo.value?.view?.calendar) {
    selectedDateInfo.value.view.calendar.unselect();
  }
  selectedDateInfo.value = null;
  editingEventId.value = null;
  newEventTitle.value = "";
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
  };

  handleDateSelect(selectInfo);
};

const saveEvent = async () => {
  if (!newEventTitle.value || !selectedDateInfo.value) return;

  let finalStart, finalEnd;

  if (editingEventId.value) {
    // Logic for updating existing event
    // We need to reconstruct the date from the original event or current selection
    // But wait, if we are editing, we might not have changed the date, only the time or title.
    // For simplicity, let's assume we are just updating title/time on the SAME day(s) unless we implement full date picker.
    // Actually, FullCalendar's event object has the dates.

    // If we are editing, selectedDateInfo.startStr might be the ISO string.
    const baseDate = selectedDateInfo.value.startStr.split("T")[0];

    if (isAllDay.value) {
      finalStart = baseDate;
      // For all day, end date is usually exclusive +1 day, but let's keep it simple for now or use what we have.
      // If we switched from timed to all-day, we might need to adjust.
      finalEnd = selectedDateInfo.value.endStr
        ? selectedDateInfo.value.endStr.split("T")[0]
        : baseDate;
    } else {
      finalStart = `${baseDate}T${startTime.value}:00`;
      finalEnd = `${baseDate}T${endTime.value}:00`;
    }
  } else {
    // Creating new event logic (existing)
    const { startStr, endStr } = selectedDateInfo.value;
    finalStart = startStr;
    finalEnd = endStr;

    if (!isAllDay.value) {
      const datePart = startStr.split("T")[0];
      finalStart = `${datePart}T${startTime.value}:00`;
      finalEnd = `${datePart}T${endTime.value}:00`;
    }
  }

  try {
    const method = editingEventId.value ? "PUT" : "POST";
    const body: any = {
      title: newEventTitle.value,
      start: finalStart,
      end: finalEnd,
      allDay: isAllDay.value,
    };

    if (editingEventId.value) {
      body.id = editingEventId.value;
    }

    await $fetch("/api/common/events", {
      method: method as any,
      body: body,
    });

    await refresh();
    closeModal();
  } catch (error) {
    console.error("Failed to save event", error);
    alert("Failed to save event");
  }
};

const deleteEvent = async () => {
  if (!editingEventId.value) return;

  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    await $fetch("/api/common/events", {
      method: "DELETE",
      query: { id: editingEventId.value },
    });
    await refresh();
    closeModal();
  } catch (error) {
    console.error("Failed to delete event", error);
    alert("Failed to delete event");
  }
};

const updateEvent = async (info: any) => {
  const { event } = info;
  // Only allow updating personal events
  if (event.extendedProps.type !== "personal") {
    info.revert();
    return;
  }

  try {
    await $fetch("/api/common/events", {
      method: "PUT" as any,
      body: {
        id: event.id,
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
      },
    });
  } catch (error) {
    console.error("Failed to update event", error);
    alert("Failed to update event");
    info.revert();
  }
};

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  events: events, // Pass the ref directly so it updates on refresh
  editable: true, // Enable drag and drop
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  dateClick: handleDateClick, // Handle single clicks (especially on mobile)
  selectLongPressDelay: 200, // Reduce delay for touch selection
  eventDrop: updateEvent,
  eventResize: updateEvent,
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

  // Adjust aspect ratio for mobile to make it more compact if needed
  // calendarOptions.value.aspectRatio = isMobile ? 0.8 : 1.35;
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

    <!-- Event Creation Modal -->
    <dialog id="event_modal" class="modal" ref="eventModal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ editingEventId ? "Edit Event" : "Create Personal Event" }}
        </h3>
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text">Event Title</span>
          </label>
          <input
            v-model="newEventTitle"
            type="text"
            placeholder="Study for math test"
            class="input input-bordered w-full"
            @keyup.enter="saveEvent"
          />
        </div>

        <div class="form-control w-full mt-4">
          <label class="label cursor-pointer justify-start gap-4">
            <span class="label-text">All Day</span>
            <input type="checkbox" class="checkbox" v-model="isAllDay" />
          </label>
        </div>

        <div v-if="!isAllDay" class="flex flex-col md:flex-row gap-4 mt-4">
          <div class="form-control w-full md:w-1/2">
            <label class="label">
              <span class="label-text">Start Time</span>
            </label>
            <input
              v-model="startTime"
              type="time"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control w-full md:w-1/2">
            <label class="label">
              <span class="label-text">End Time</span>
            </label>
            <input
              v-model="endTime"
              type="time"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button
              v-if="editingEventId"
              class="btn btn-error mr-2"
              @click.prevent="deleteEvent"
            >
              Delete
            </button>
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click.prevent="saveEvent">
              {{ editingEventId ? "Save" : "Create" }}
            </button>
          </form>
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
