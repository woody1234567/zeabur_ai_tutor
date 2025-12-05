<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
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
      <h1 class="text-3xl font-bold">{{ $t("calendar_help.title") }}</h1>
    </div>

    <div class="space-y-8">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            {{ $t("calendar_help.create_events.title") }}
          </h2>

          <div class="steps steps-vertical">
            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("calendar_help.create_events.step1.title") }}
                </h3>
                <p>
                  {{ $t("calendar_help.create_events.step1.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("calendar_help.create_events.step2.title") }}
                </h3>
                <p>
                  {{ $t("calendar_help.create_events.step2.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("calendar_help.create_events.step3.title") }}
                </h3>
                <p>
                  {{ $t("calendar_help.create_events.step3.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("calendar_help.create_events.step4.title") }}
                </h3>
                <p>
                  {{ $t("calendar_help.create_events.step4.desc") }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            {{ $t("calendar_help.managing_events.title") }}
          </h2>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <span class="font-bold">{{
                $t("calendar_help.managing_events.move.title")
              }}</span>
              {{ $t("calendar_help.managing_events.move.desc") }}
            </li>
            <li>
              <span class="font-bold">{{
                $t("calendar_help.managing_events.resize.title")
              }}</span>
              {{ $t("calendar_help.managing_events.resize.desc") }}
            </li>
            <li>
              <span class="font-bold">{{
                $t("calendar_help.managing_events.homework.title")
              }}</span>
              {{ $t("calendar_help.managing_events.homework.desc") }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
