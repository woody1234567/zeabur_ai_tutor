<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink to="/student" class="btn btn-circle btn-ghost">
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
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </NuxtLink>
      <h1 class="text-3xl font-bold">Calendar Help</h1>
    </div>

    <div class="space-y-8">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            How to Create Personal Events
          </h2>

          <div class="steps steps-vertical">
            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Select a Date or Time Range</h3>
                <p>
                  Click on a specific day in the Month view, or click and drag
                  across time slots in the Week/Day view.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Enter Event Details</h3>
                <p>
                  A modal will appear. Enter a title for your event (e.g.,
                  "Study Group").
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Choose Time Options</h3>
                <p>
                  By default, "All Day" is checked. Uncheck it to specify exact
                  Start and End times.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Create Event</h3>
                <p>
                  Click the "Create" button to save your event to the calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">Managing Events</h2>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <span class="font-bold">Move Event:</span> Drag and drop your
              personal events (green) to move them to a different day or time.
            </li>
            <li>
              <span class="font-bold">Resize Event:</span> Drag the bottom edge
              of a timed event to change its duration.
            </li>
            <li>
              <span class="font-bold">Homework:</span> Homework deadlines (blue)
              are automatically added by your teachers and cannot be moved.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
