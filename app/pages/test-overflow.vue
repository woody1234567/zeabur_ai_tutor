<script setup lang="ts">
import MarkdownRenderer from "~/components/MarkdownRenderer.vue";

const longEquation = `
Here is a very long equation that should overflow:

$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} + \\text{some very long text to force overflow because it is just way too long to fit in a small container} + \\text{even more text to be absolutely sure it overflows} $$

And some code:

\`\`\`javascript
function veryLongFunctionNameThatShouldAlsoOverflowBecauseItIsExtremelyLongAndHasNoBreaksInItWhatsoever() {
  console.log("Hello World");
}
\`\`\`
`;
</script>

<template>
  <div class="p-10 space-y-10">
    <h1 class="text-2xl font-bold">Overflow Test</h1>

    <div class="border p-4 w-64 bg-base-200 rounded-lg">
      <h2 class="font-bold mb-2">Small Container (w-64)</h2>
      <MarkdownRenderer :content="longEquation" />
    </div>

    <div class="border p-4 w-96 bg-base-200 rounded-lg">
      <h2 class="font-bold mb-2">Medium Container (w-96)</h2>
      <MarkdownRenderer :content="longEquation" />
    </div>
  </div>
</template>
