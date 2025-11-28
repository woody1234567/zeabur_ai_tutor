<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
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
      <h1 class="text-3xl font-bold">Problem Creation Help</h1>
    </div>

    <div class="space-y-8">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">How to Create a Problem</h2>

          <div class="steps steps-vertical">
            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Enter Problem Details</h3>
                <p>
                  Fill in the Title, and Difficulty level. You can also add a
                  Source reference.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Add Hashtags</h3>
                <p>
                  Add hashtags to categorize the problem (e.g., #algebra,
                  #geometry). Press Enter to add a tag.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Add Content</h3>
                <p>
                  Use the editor to add the problem content. You can use
                  Markdown for formatting and latex for math equations. There
                  are also some tools to help you create the content(OCR, AI
                  formatting).
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Upload Image (Optional)</h3>
                <p>
                  You can upload an image to accompany the problem. It will be
                  displayed above the problem content.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Add Choices</h3>
                <p>
                  Add multiple choice options. Mark the correct answer using the
                  radio button. You can add more choices as needed.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Provide Explanation</h3>
                <p>
                  Write a detailed explanation for the solution. This will be
                  shown to students after they attempt the problem.
                </p>
              </div>
            </div>

            <div class="step step-primary">
              <div class="text-left ml-4">
                <h3 class="font-bold">Submit</h3>
                <p>Click "Create Problem" to save it to the database.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">Live Preview Feature</h2>
          <p>
            As you type in the editor on the left, the Live Preview panel on the
            right shows exactly how the problem will appear to students.
          </p>
          <ul class="list-disc list-inside space-y-2 mt-4">
            <li>
              <span class="font-bold">Markdown Support:</span> Use standard
              Markdown for formatting (bold, italic, lists, etc.).
            </li>
            <li>
              <span class="font-bold">LaTeX Support:</span> Use
              <code>$</code> for inline math and <code>$$</code> for block math
              equations.
            </li>
            <li>
              <span class="font-bold">Image Preview:</span> Uploaded images will
              appear in the preview immediately.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
