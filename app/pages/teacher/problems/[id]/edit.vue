<script setup lang="ts">
import TeacherProblemForm from "~/components/teacher/ProblemForm.vue";
import TeacherProblemPreview from "~/components/teacher/ProblemPreview.vue";

definePageMeta({
  layout: "teacher",
});

const route = useRoute();
const problemId = route.params.id as string;

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
  source: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  hashtags: string[];
}

interface FetchedProblem {
  id: string;
  title: string;
  content: string;
  choices: string[] | Record<string, string>;
  correctAnswer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  source: string | null;
  imageUrl: string | null;
  hashtags: string[] | null;
}

const formData = ref<ProblemData>({
  title: "",
  content: "",
  choices: [{ text: "", isCorrect: false }],
  correctAnswer: "",
  explanation: "",
  difficulty: "medium",
  source: "",
  imageFile: null,
  imagePreviewUrl: null,
  hashtags: [],
});

const isUploading = ref(false);

// Fetch existing problem
const { data: problem, error } = await useFetch<FetchedProblem>(
  `/api/teacher/problems/${problemId}`
);

watchEffect(() => {
  if (problem.value) {
    formData.value = {
      title: problem.value.title,
      content: problem.value.content,
      choices: Array.isArray(problem.value.choices)
        ? problem.value.choices.map((c) => ({
            text: c,
            isCorrect: false, // Not used anymore
          }))
        : Object.entries(problem.value.choices)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([_, text]) => ({
              text: text as string,
              isCorrect: false,
            })),
      correctAnswer: problem.value.correctAnswer,
      explanation: problem.value.explanation || "",
      difficulty: problem.value.difficulty,
      source: problem.value.source || "",
      imageFile: null,
      imagePreviewUrl: problem.value.imageUrl || null,
      hashtags: problem.value.hashtags || [],
    };
  }
});

const updateProblem = async () => {
  try {
    isUploading.value = true;
    if (!problem.value)
      throw new Error(useNuxtApp().$i18n.t("teacher.problems.edit.not_found"));
    let imageUrl = problem.value.imageUrl || "";

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

    // Update problem
    await $fetch(`/api/teacher/problems/${problemId}`, {
      method: "PUT",
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
        source: formData.value.source,
        imageUrl,
        hashtags: formData.value.hashtags,
      },
    });

    alert(useNuxtApp().$i18n.t("teacher.problems.edit.success"));
    navigateTo("/teacher/problems");
  } catch (error: any) {
    console.error("Error updating problem:", error);
    alert(
      `${useNuxtApp().$i18n.t("teacher.problems.edit.error")} ${
        error.message || "Unknown error"
      }`
    );
  } finally {
    isUploading.value = false;
  }
};

const handleCancel = () => {
  navigateTo("/teacher/problems");
};
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-7xl">
    <h1 class="text-2xl font-bold mb-6">
      {{ $t("teacher.problems.edit.title") }}
    </h1>

    <div v-if="problem" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Editor -->
      <div>
        <TeacherProblemForm
          v-model="formData"
          :is-uploading="isUploading"
          :submit-label="$t('teacher.problems.edit.submit')"
          @submit="updateProblem"
          @cancel="handleCancel"
        />
      </div>

      <!-- Right Column: Live Preview -->
      <div class="mt-8 lg:mt-0">
        <TeacherProblemPreview :problem="formData" />
      </div>
    </div>
    <div v-else-if="error" class="alert alert-error">
      {{ $t("teacher.problems.edit.load_error") }} {{ error.message }}
    </div>
    <div v-else class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  </div>
</template>
