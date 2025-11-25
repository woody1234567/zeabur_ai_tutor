<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const title = ref("");
const content = ref("");
const choices = ref([{ text: "", isCorrect: false }]);
const correctAnswer = ref("");
const explanation = ref("");
const difficulty = ref("medium");
const source = ref("");
const imageFile = ref<File | null>(null);
const isUploading = ref(false);

const addChoice = () => {
  choices.value.push({ text: "", isCorrect: false });
};

const removeChoice = (index: number) => {
  choices.value.splice(index, 1);
};

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0];
  }
};

const validateForm = () => {
  if (!title.value.trim()) {
    alert("Please enter a title");
    return false;
  }
  if (!content.value.trim()) {
    alert("Please enter problem content");
    return false;
  }
  if (choices.value.length < 2) {
    alert("Please add at least 2 choices");
    return false;
  }
  if (choices.value.some((c) => !c.text.trim())) {
    alert("Please fill in all choice texts");
    return false;
  }
  if (!correctAnswer.value) {
    alert("Please select a correct answer");
    return false;
  }
  return true;
};

const submitProblem = async () => {
  if (!validateForm()) return;

  try {
    isUploading.value = true;
    let imageUrl = "";

    if (imageFile.value) {
      const formData = new FormData();
      formData.append("file", imageFile.value);

      const { imageUrl: uploadedUrl } = await $fetch<{ imageUrl: string }>(
        "/api/teacher/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      imageUrl = uploadedUrl;
    }

    // Create problem
    await $fetch("/api/teacher/problems", {
      method: "POST",
      body: {
        title: title.value,
        content: content.value,
        choices: choices.value.map((c) => c.text),
        correctAnswer: correctAnswer.value,
        explanation: explanation.value,
        difficulty: difficulty.value,
        source: source.value,
        imageUrl,
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
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">Create New Problem</h1>

    <form @submit.prevent="submitProblem" class="space-y-4">
      <div class="form-control">
        <label class="label">Title</label>
        <input
          v-model="title"
          type="text"
          class="input input-bordered"
          required
        />
      </div>

      <div class="form-control">
        <label class="label">Content (Markdown supported)</label>
        <textarea
          v-model="content"
          class="textarea textarea-bordered h-32"
          required
        ></textarea>
      </div>

      <div class="form-control">
        <label class="label">Image (Optional)</label>
        <input
          type="file"
          @change="handleImageUpload"
          accept="image/*"
          class="file-input file-input-bordered"
        />
      </div>

      <div class="form-control">
        <label class="label">Choices</label>
        <div
          v-for="(choice, index) in choices"
          :key="index"
          class="flex gap-2 mb-2"
        >
          <input
            v-model="choice.text"
            type="text"
            class="input input-bordered flex-1"
            placeholder="Choice text"
            required
          />
          <input
            type="radio"
            name="correctAnswer"
            :value="choice.text"
            v-model="correctAnswer"
            class="radio radio-primary mt-3"
            required
          />
          <button
            type="button"
            @click="removeChoice(index)"
            class="btn btn-square btn-error btn-sm mt-1"
          >
            ✕
          </button>
        </div>
        <button type="button" @click="addChoice" class="btn btn-sm btn-ghost">
          + Add Choice
        </button>
      </div>

      <div class="form-control">
        <label class="label">Explanation</label>
        <textarea
          v-model="explanation"
          class="textarea textarea-bordered h-24"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">Difficulty</label>
          <select v-model="difficulty" class="select select-bordered">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">Source</label>
          <input v-model="source" type="text" class="input input-bordered" />
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="isUploading"
      >
        {{ isUploading ? "Uploading..." : "Create Problem" }}
      </button>
    </form>
  </div>
</template>
