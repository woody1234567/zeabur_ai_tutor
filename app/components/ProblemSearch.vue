<script setup lang="ts">
const filters = reactive({
  keyword: "",
  source: "",
  hashtag: "",
});

const emit = defineEmits<{
  search: [params: { title: string; source: string; hashtag: string }];
}>();

const handleSearch = () => {
  emit("search", {
    title: filters.keyword,
    source: filters.source,
    hashtag: filters.hashtag,
  });
};

const clearFilters = () => {
  filters.keyword = "";
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

      <div class="card-actions justify-end mt-6 gap-3">
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
</template>
