<script setup lang="ts">
import { marked } from "marked";
import katex from "katex";
import DOMPurify from "isomorphic-dompurify";
import "katex/dist/katex.min.css";

const props = defineProps<{
  content: string;
}>();

// Configure marked options if needed
marked.use({
  breaks: true,
  gfm: true,
});

const renderedContent = computed(() => {
  if (!props.content) return "";

  // 1. Render Markdown to HTML
  const rawHtml = marked.parse(props.content) as string;

  // 2. Sanitize HTML
  const sanitizedHtml = DOMPurify.sanitize(rawHtml);

  // 3. Render LaTeX
  // We need to handle this carefully. Since marked might escape some LaTeX characters,
  // a common strategy is to render LaTeX *before* markdown or use a custom renderer.
  // However, for simplicity and robustness with standard LLM outputs (which often mix them),
  // we'll try to render LaTeX in the final HTML string.
  // Note: This is a simplified approach. For complex cases, a custom marked tokenizer is better.

  // But wait, if we render markdown first, $x^2$ might become $x^2$ or similar.
  // Let's try a different approach:
  // We will use a temporary placeholder for LaTeX, render markdown, then put LaTeX back and render it.
  // OR, we can just use a library that handles both, but we are building it manually.

  // Let's try to render LaTeX on the *output* HTML.
  // But KaTeX works on text.

  // BETTER APPROACH:
  // Use a custom renderer for marked that detects math blocks.
  // But that requires writing a tokenizer.

  // ALTERNATIVE:
  // Pre-process the string to replace $$...$$ and $...$ with placeholders.
  // Render Markdown.
  // Replace placeholders with rendered KaTeX.

  const mathBlocks: string[] = [];
  const PLACEHOLDER = "%%%MATH_BLOCK_";

  let processedContent = props.content.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (match, math) => {
      const id = mathBlocks.length;
      try {
        mathBlocks.push(katex.renderToString(math, { displayMode: true }));
      } catch (e) {
        mathBlocks.push(match); // Fallback on error
      }
      return `${PLACEHOLDER}${id}%%%`;
    }
  );

  processedContent = processedContent.replace(
    /\$([\s\S]*?)\$/g,
    (match, math) => {
      const id = mathBlocks.length;
      try {
        mathBlocks.push(katex.renderToString(math, { displayMode: false }));
      } catch (e) {
        mathBlocks.push(match);
      }
      return `${PLACEHOLDER}${id}%%%`;
    }
  );

  const html = marked.parse(processedContent) as string;
  const sanitized = DOMPurify.sanitize(html);

  // Restore math blocks
  return sanitized.replace(
    /%%%MATH_BLOCK_(\d+)%%%/g,
    (match: string, id: string) => {
      return mathBlocks[parseInt(id)];
    }
  );
});
</script>

<template>
  <div class="markdown-body prose max-w-none" v-html="renderedContent"></div>
</template>

<style>
/* Add any specific overrides for markdown styles here */
.markdown-body {
  @apply text-base leading-relaxed;
}
.markdown-body p {
  @apply mb-0;
}
.markdown-body ul {
  @apply list-disc pl-5 mb-4;
}
.markdown-body ol {
  @apply list-decimal pl-5 mb-4;
}
.markdown-body code {
  @apply bg-base-300 px-1 py-0.5 rounded text-sm font-mono;
}
.markdown-body pre {
  @apply bg-base-300 p-4 rounded-lg overflow-x-auto mb-4;
}
.markdown-body pre code {
  @apply bg-transparent p-0;
}
</style>
