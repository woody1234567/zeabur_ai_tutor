<script setup lang="ts">
const props = defineProps<{
  modelValue?: string;
  roleFilter?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:roleFilter", value: string): void;
  (e: "search"): void;
}>();

const searchQuery = computed({
  get: () => props.modelValue || "",
  set: (val) => emit("update:modelValue", val),
});

const selectedRole = computed({
  get: () => props.roleFilter || "",
  set: (val) => emit("update:roleFilter", val),
});

const handleSearch = () => {
  emit("search");
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl mb-8">
    <div class="card-body">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="form-control flex-1 w-full">
          <label class="label">
            <span class="label-text">{{
              $t("components.admin.search.label")
            }}</span>
          </label>
          <div class="join w-full">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('components.admin.search.placeholder')"
              class="input input-bordered join-item w-full"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <div class="form-control w-full md:w-48">
          <label class="label">
            <span class="label-text">{{
              $t("components.admin.search.role_label")
            }}</span>
          </label>
          <select
            v-model="selectedRole"
            class="select select-bordered w-full"
            @change="handleSearch"
          >
            <option value="">
              {{ $t("components.admin.search.all_roles") }}
            </option>
            <option value="student">
              {{ $t("components.admin.search.student") }}
            </option>
            <option value="parent">
              {{ $t("components.admin.search.parent") }}
            </option>
            <option value="teacher">
              {{ $t("components.admin.search.teacher") }}
            </option>
            <option value="admin">
              {{ $t("components.admin.search.admin") }}
            </option>
          </select>
        </div>

        <button class="btn btn-primary" @click="handleSearch">
          <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
          {{ $t("components.admin.search.search_button") }}
        </button>
      </div>
    </div>
  </div>
</template>
