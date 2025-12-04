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
  <div class="flex gap-2 items-end">
    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">Search User</span>
      </label>
      <input
        type="text"
        placeholder="Name or Email"
        class="input input-bordered w-full max-w-xs"
        v-model="searchQuery"
        @keyup.enter="handleSearch"
      />
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">Role</span>
      </label>
      <select class="select select-bordered" v-model="selectedRole">
        <option value="">All Roles</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <button class="btn btn-primary" @click="handleSearch">Search</button>
  </div>
</template>
