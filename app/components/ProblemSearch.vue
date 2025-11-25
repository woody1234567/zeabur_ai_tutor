<script setup lang="ts">
const title = ref("");
const source = ref("");
const hashtag = ref("");

const emit = defineEmits<{
  search: [params: { title: string; source: string; hashtag: string }];
}>();

const handleSearch = () => {
  emit("search", {
    title: title.value,
    source: source.value,
    hashtag: hashtag.value,
  });
};

const clearSearch = () => {
  title.value = "";
  source.value = "";
  hashtag.value = "";
  handleSearch();
};
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 mb-8">
    <div class="card-body">
      <h2 class="card-title text-lg mb-4">Search Problems</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Keyword (Title)</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Search by title..."
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Source</span>
          </label>
          <input
            v-model="source"
            type="text"
            placeholder="e.g. Textbook, Exam..."
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Hashtag</span>
          </label>
          <input
            v-model="hashtag"
            type="text"
            placeholder="e.g. math, physics..."
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <div class="card-actions justify-end mt-4">
        <button @click="clearSearch" class="btn btn-ghost">Clear</button>
        <button @click="handleSearch" class="btn btn-primary">Search</button>
      </div>
    </div>
  </div>
</template>
