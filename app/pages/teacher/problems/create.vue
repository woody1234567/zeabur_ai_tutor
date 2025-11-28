<script setup lang="ts">
import TeacherProblemForm from "~/components/teacher/ProblemForm.vue";
import TeacherProblemPreview from "~/components/teacher/ProblemPreview.vue";

definePageMeta({
  layout: "teacher",
});

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
        choices: formData.value.choices.map((c) => c.text),
        correctAnswer: formData.value.correctAnswer,
        explanation: formData.value.explanation,
        difficulty: formData.value.difficulty,
        source: formData.value.source,
        imageUrl,
        hashtags: formData.value.hashtags,
      },
    });

    alert("Problem created successfully!");
    navigateTo("/teacher/problems");
  } catch (error: any) {
    console.error("Error creating problem:", error);
    alert(`Failed to create problem: ${error.message || "Unknown error"}`);
  } finally {
    isUploading.value = false;
  }
};

const handleCancel = () => {
  navigateTo("/teacher/problems");
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <div class="flex items-center gap-2 mb-6">
      <h1 class="text-2xl font-bold">Create New Problem</h1>
      <NuxtLink
        to="/teacher/problems/help"
        class="btn btn-circle btn-ghost btn-sm"
        title="Help"
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
        <TeacherProblemForm
          v-model="formData"
          :is-uploading="isUploading"
          submit-label="Create Problem"
          @submit="submitProblem"
          @cancel="handleCancel"
        />
      </div>

      <!-- Right Column: Live Preview -->
      <div class="hidden lg:block">
        <TeacherProblemPreview :problem="formData" />
      </div>
    </div>
  </div>
</template>
