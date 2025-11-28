<script setup lang="ts">
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

definePageMeta({
  layout: "student",
});

const { data: events, refresh } = await useFetch(
  "/api/student/homework-calendar"
);

const eventModal = ref<HTMLDialogElement | null>(null);
const newEventTitle = ref("");
const selectedDateInfo = ref<any>(null);
const isAllDay = ref(true);
const startTime = ref("09:00");
const endTime = ref("10:00");

const handleDateSelect = (selectInfo: any) => {
  selectedDateInfo.value = selectInfo;
  newEventTitle.value = "";
  isAllDay.value = selectInfo.allDay;
  eventModal.value?.showModal();
};

const closeModal = () => {
  eventModal.value?.close();
  selectedDateInfo.value?.view.calendar.unselect();
  selectedDateInfo.value = null;
};

const createEvent = async () => {
  if (!newEventTitle.value || !selectedDateInfo.value) return;

  const { startStr, endStr } = selectedDateInfo.value;
  let finalStart = startStr;
  let finalEnd = endStr;

  if (!isAllDay.value) {
    // If not all day, we need to combine the date with the selected time
    // startStr from dayGrid selection is usually YYYY-MM-DD
    // We need YYYY-MM-DDTHH:mm:ss
    const datePart = startStr.split("T")[0]; // Ensure we have just the date
    finalStart = `${datePart}T${startTime.value}:00`;
    finalEnd = `${datePart}T${endTime.value}:00`;
  }

  try {
    await $fetch("/api/student/events", {
      method: "POST",
      body: {
        title: newEventTitle.value,
        start: finalStart,
        end: finalEnd,
        allDay: isAllDay.value,
      },
    });

    await refresh(); // Refresh events from server
    closeModal();
  } catch (error) {
    console.error("Failed to create event", error);
    alert("Failed to create event");
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
    await $fetch("/api/student/events", {
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
  eventDrop: updateEvent,
  eventResize: updateEvent,
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Student Dashboard</h1>
      <NuxtLink
        to="/student/calendar-help"
        class="btn btn-circle btn-ghost"
        title="Calendar Help"
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
    <div class="bg-base-100 p-4 rounded-lg shadow">
      <FullCalendar :options="calendarOptions" class="fc-daisy" />
    </div>

    <!-- Event Creation Modal -->
    <dialog id="event_modal" class="modal" ref="eventModal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Create Personal Event</h3>
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text">Event Title</span>
          </label>
          <input
            v-model="newEventTitle"
            type="text"
            placeholder="Study for math test"
            class="input input-bordered w-full"
            @keyup.enter="createEvent"
          />
        </div>

        <div class="form-control w-full mt-4">
          <label class="label cursor-pointer justify-start gap-4">
            <span class="label-text">All Day</span>
            <input type="checkbox" class="checkbox" v-model="isAllDay" />
          </label>
        </div>

        <div v-if="!isAllDay" class="flex gap-4 mt-4">
          <div class="form-control w-1/2">
            <label class="label">
              <span class="label-text">Start Time</span>
            </label>
            <input
              v-model="startTime"
              type="time"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control w-1/2">
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
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click.prevent="createEvent">
              Create
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
</style>
