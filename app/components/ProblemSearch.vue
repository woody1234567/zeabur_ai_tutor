<script setup lang="ts">
const filters = reactive({
  keyword: "",
  subject: "",
  chapter: "",
  grade: "",
  difficulty: "",
  source: "",
  hashtag: "",
});

const pageSize = defineModel<number>("pageSize", { default: 12 });

const pageSizeOptions = [12, 24, 48, 96];

const emit = defineEmits<{
  search: [
    params: {
      title: string;
      subject: string;
      chapter: string;
      grade: string;
      difficulty: string;
      source: string;
      hashtag: string;
    },
  ];
}>();

const handleSearch = () => {
  emit("search", {
    title: filters.keyword,
    subject: filters.subject,
    chapter: filters.chapter,
    grade: filters.grade,
    difficulty: filters.difficulty,
    source: filters.source,
    hashtag: filters.hashtag,
  });
};

const clearFilters = () => {
  filters.keyword = "";
  filters.subject = "";
  filters.chapter = "";
  filters.grade = "";
  filters.difficulty = "";
  filters.source = "";
  filters.hashtag = "";
  handleSearch();
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        {{ $t("components.common.search.title") }}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Keyword Search -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.keyword_label")
            }}</span>
          </label>
          <div class="relative">
            <input
              v-model="filters.keyword"
              type="text"
              :placeholder="$t('components.common.search.keyword_placeholder')"
              class="input input-bordered w-full pl-10"
              @keyup.enter="handleSearch"
            />
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Icon
                name="heroicons:magnifying-glass"
                class="w-5 h-5 text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- Subject Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.subject_label")
            }}</span>
          </label>
          <input
            v-model="filters.subject"
            type="text"
            :placeholder="$t('components.common.search.subject_placeholder')"
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Chapter Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.chapter_label")
            }}</span>
          </label>
          <input
            v-model="filters.chapter"
            type="text"
            :placeholder="$t('components.common.search.chapter_placeholder')"
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Grade Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.grade_label")
            }}</span>
          </label>
          <input
            v-model="filters.grade"
            type="text"
            :placeholder="$t('components.common.search.grade_placeholder')"
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Difficulty Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.difficulty_label")
            }}</span>
          </label>
          <select
            v-model="filters.difficulty"
            class="select select-bordered w-full"
          >
            <option value="">{{ $t("components.common.search.all") }}</option>
            <option value="easy">{{ $t("components.common.search.difficulty_easy") }}</option>
            <option value="medium">{{ $t("components.common.search.difficulty_medium") }}</option>
            <option value="hard">{{ $t("components.common.search.difficulty_hard") }}</option>
          </select>
        </div>

        <!-- Source Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.source_label")
            }}</span>
          </label>
          <input
            v-model="filters.source"
            type="text"
            :placeholder="$t('components.common.search.source_placeholder')"
            class="input input-bordered w-full"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Hashtag Filter -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">{{
              $t("components.common.search.hashtag_label")
            }}</span>
          </label>
          <div class="relative">
            <input
              v-model="filters.hashtag"
              type="text"
              :placeholder="$t('components.common.search.hashtag_placeholder')"
              class="input input-bordered w-full pl-10"
              @keyup.enter="handleSearch"
            />
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Icon name="heroicons:tag" class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div class="card-actions justify-between items-center mt-6">
        <div class="form-control">
          <div class="flex items-center gap-2">
            <span class="label-text font-medium whitespace-nowrap">{{
              $t("components.common.search.per_page")
            }}</span>
            <select
              v-model.number="pageSize"
              class="select select-bordered select-sm"
            >
              <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-ghost" @click="clearFilters">
            <Icon name="heroicons:x-mark" class="w-5 h-5 mr-2" />
            {{ $t("components.common.search.clear") }}
          </button>
          <button class="btn btn-primary" @click="handleSearch">
            <Icon name="heroicons:funnel" class="w-5 h-5 mr-2" />
            {{ $t("components.common.search.search") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
