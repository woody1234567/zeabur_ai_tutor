<script setup lang="ts">
import TeacherProblemForm from "~/components/teacher/ProblemForm.vue";
import TeacherProblemPreview from "~/components/teacher/ProblemPreview.vue";

definePageMeta({
  layout: "teacher",
});
const localePath = useLocalePath();
const route = useRoute();

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface ProblemData {
  title: string;
  content: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  chapter: string;
  grade: string;
  source: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  hashtags: string[];
}

interface Testbank {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

const formData = ref<ProblemData>({
  title: "",
  content: "",
  choices: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
  correctAnswer: "",
  explanation: "",
  difficulty: "medium",
  subject: "",
  chapter: "",
  grade: "",
  source: "",
  imageFile: null,
  imagePreviewUrl: null,
  hashtags: [],
});

const isUploading = ref(false);

// Testbank selector
const { data: testbanks } = await useFetch<Testbank[]>("/api/teacher/testbanks");
const selectedTestbankIds = ref<string[]>([]);

watch(testbanks, (tbs) => {
  if (!tbs || selectedTestbankIds.value.length > 0) return;
  const preselectId = route.query.testbankId as string | undefined;
  if (preselectId && tbs.some(t => t.id === preselectId)) {
    selectedTestbankIds.value = [preselectId];
  } else {
    const firstPublic = tbs.find(t => t.isPublic);
    if (firstPublic) selectedTestbankIds.value = [firstPublic.id];
  }
}, { immediate: true });

const toggleTestbank = (id: string) => {
  const idx = selectedTestbankIds.value.indexOf(id);
  if (idx === -1) selectedTestbankIds.value.push(id);
  else selectedTestbankIds.value.splice(idx, 1);
};

const submitProblem = async () => {
  try {
    isUploading.value = true;
    let imageUrl = "";

    if (formData.value.imageFile) {
      const uploadData = new FormData();
      uploadData.append("file", formData.value.imageFile);

      const { imageUrl: uploadedUrl } = await $fetch<{ imageUrl: string }>(
        "/api/teacher/upload",
        {
          method: "POST",
          body: uploadData,
        }
      );

      imageUrl = uploadedUrl;
    }

    // Create problem
    await $fetch("/api/teacher/problems", {
      method: "POST",
      body: {
        title: formData.value.title,
        content: formData.value.content,
        choices: formData.value.choices.reduce((acc, choice, index) => {
          acc[String.fromCharCode(65 + index)] = choice.text;
          return acc;
        }, {} as Record<string, string>),
        correctAnswer: formData.value.correctAnswer,
        explanation: formData.value.explanation,
        difficulty: formData.value.difficulty,
        subject: formData.value.subject,
        chapter: formData.value.chapter,
        grade: formData.value.grade,
        source: formData.value.source,
        imageUrl,
        hashtags: formData.value.hashtags,
        testbankIds: selectedTestbankIds.value,
      },
    });

    alert(useNuxtApp().$i18n.t("teacher.problems.create.success"));
    navigateTo(localePath("/teacher/problems"));
  } catch (error: any) {
    console.error("Error creating problem:", error);
    alert(
      `${useNuxtApp().$i18n.t("teacher.problems.create.error")} ${
        error.message || "Unknown error"
      }`
    );
  } finally {
    isUploading.value = false;
  }
};

const handleCancel = () => {
  navigateTo(localePath("/teacher/problems"));
};
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-7xl">
    <div class="flex items-center gap-2 mb-6">
      <h1 class="text-2xl font-bold">
        {{ $t("teacher.problems.create.title") }}
      </h1>
      <NuxtLink
        :to="localePath('/teacher/problems/help')"
        class="btn btn-circle btn-ghost btn-sm"
        :title="$t('teacher.problems.create.help')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Editor -->
      <div>
        <!-- Testbank Selector -->
        <div v-if="testbanks && testbanks.length > 0" class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg">{{ $t('teacher.problems.select_testbank') }}</h2>
            <div class="space-y-2">
              <label
                v-for="tb in testbanks"
                :key="tb.id"
                class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-base-200"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  :checked="selectedTestbankIds.includes(tb.id)"
                  @change="toggleTestbank(tb.id)"
                />
                <span class="flex-1">{{ tb.name }}</span>
                <span
                  class="badge badge-sm"
                  :class="tb.isPublic ? 'badge-success' : 'badge-warning'"
                >
                  {{ tb.isPublic ? $t('teacher.problems.testbanks.is_public') : $t('teacher.problems.testbanks.is_private') }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <TeacherProblemForm
          v-model="formData"
          :is-uploading="isUploading"
          :submit-label="$t('teacher.problems.create.submit')"
          @submit="submitProblem"
          @cancel="handleCancel"
        />
      </div>

      <!-- Right Column: Live Preview -->
      <div class="mt-8 lg:mt-0">
        <TeacherProblemPreview :problem="formData" />
      </div>
    </div>
  </div>
</template>
