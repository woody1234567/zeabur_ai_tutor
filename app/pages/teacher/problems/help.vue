<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
</script>

<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink to="/teacher/problems" class="btn btn-circle btn-ghost">
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
      <h1 class="text-3xl font-bold">
        {{ $t("teacher.problems.help_page.title") }}
      </h1>
    </div>

    <div class="space-y-8">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            {{ $t("teacher.problems.help_page.how_to.title") }}
          </h2>

          <div class="steps steps-vertical">
            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step1.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step1.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step2.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step2.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step3.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step3.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step4.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step4.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step5.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step5.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step6.title") }}
                </h3>
                <p>
                  {{ $t("teacher.problems.help_page.how_to.step6.desc") }}
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">
                  {{ $t("teacher.problems.help_page.how_to.step7.title") }}
                </h3>
                <p>{{ $t("teacher.problems.help_page.how_to.step7.desc") }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            {{ $t("teacher.problems.help_page.preview.title") }}
          </h2>
          <p>
            {{ $t("teacher.problems.help_page.preview.desc") }}
          </p>
          <ul class="list-disc list-inside space-y-2 mt-4">
            <li>
              <span class="font-bold">{{
                $t("teacher.problems.help_page.preview.markdown_title")
              }}</span>
              {{ $t("teacher.problems.help_page.preview.markdown_desc") }}
            </li>
            <li>
              <span class="font-bold">{{
                $t("teacher.problems.help_page.preview.latex_title")
              }}</span>
              {{ $t("teacher.problems.help_page.preview.latex_desc") }}
            </li>
            <li>
              <span class="font-bold">{{
                $t("teacher.problems.help_page.preview.image_title")
              }}</span>
              {{ $t("teacher.problems.help_page.preview.image_desc") }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
