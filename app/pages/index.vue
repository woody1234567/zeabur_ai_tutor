<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const theme = useState<string>("theme", () => "dark");
const robotTheme = computed(() => (theme.value === "dark" ? "dark" : "light"));
const localePath = useLocalePath();
</script>

<template>
  <div class="bg-base-200">
    <!-- Hero Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="hero min-h-[70vh] bg-base-100 rounded-lg">
        <common-robot :theme="robotTheme" />
      </div>

      <div class="hero min-h-[70vh] bg-base-100 rounded-lg">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold">{{ $t("landing.hero.title") }}</h1>
            <p class="py-6">
              {{ $t("landing.hero.description") }}
            </p>
            <NuxtLink :to="localePath('/auth')" class="btn btn-primary">{{
              $t("landing.hero.get_started")
            }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-20 container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-12">
        {{ $t("landing.features.title") }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.online_homework.title") }}
            </h3>
            <p>
              {{ $t("landing.features.online_homework.description") }}
            </p>
          </div>
        </div>

        <!-- Feature 2 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.progress_tracking.title") }}
            </h3>
            <p>
              {{ $t("landing.features.progress_tracking.description") }}
            </p>
          </div>
        </div>

        <!-- Feature 3 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.instant_feedback.title") }}
            </h3>
            <p>
              {{ $t("landing.features.instant_feedback.description") }}
            </p>
          </div>
        </div>

        <!-- Feature 4 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.ai_tutor_chat.title") }}
            </h3>
            <p>
              {{ $t("landing.features.ai_tutor_chat.description") }}
            </p>
          </div>
        </div>

        <!-- Feature 5 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.class_materials.title") }}
            </h3>
            <p>
              {{ $t("landing.features.class_materials.description") }}
            </p>
          </div>
        </div>

        <!-- Feature 6 -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center text-center">
            <div class="text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="card-title">
              {{ $t("landing.features.scheduling.title") }}
            </h3>
            <p>
              {{ $t("landing.features.scheduling.description") }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Roles Section -->
    <div class="py-20 bg-base-100">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">
          {{ $t("landing.roles.title") }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Student -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <h3 class="card-title text-primary mb-4">
                {{ $t("landing.roles.student.title") }}
              </h3>
              <ul class="space-y-2">
                <li v-for="n in 5" :key="n" class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ $t(`landing.roles.student.feature_${n}`) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Teacher -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <h3 class="card-title text-primary mb-4">
                {{ $t("landing.roles.teacher.title") }}
              </h3>
              <ul class="space-y-2">
                <li v-for="n in 5" :key="n" class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ $t(`landing.roles.teacher.feature_${n}`) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Parent -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <h3 class="card-title text-primary mb-4">
                {{ $t("landing.roles.parent.title") }}
              </h3>
              <ul class="space-y-2">
                <li v-for="n in 4" :key="n" class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ $t(`landing.roles.parent.feature_${n}`) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
