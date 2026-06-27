<script setup lang="ts">
definePageMeta({
  layout: "parent",
});
const localePath = useLocalePath();

const { data: status, pending } = await useFetch("/api/parent/status");
const { data: students } = await useFetch("/api/parent/my-students");

if (status.value) {
  if (status.value.isPending) {
    navigateTo(localePath("/parent/pending"));
  } else if (!status.value.isLinked) {
    navigateTo(localePath("/parent/starter"));
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ $t("parent.dashboard.title") }}</h1>

    <div v-if="students && students.length > 0">
      <h2 class="text-2xl font-semibold mb-4">
        {{ $t("parent.dashboard.your_students") }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="student in students"
          :key="student.id"
          class="card bg-base-100 shadow-xl"
        >
          <figure class="px-5 pt-5">
            <div class="avatar">
              <div
                class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
              >
                <img
                  class="w-full h-full"
                  :src="
                    student.image ||
                    'https://ui-avatars.com/api/?name=' + student.name
                  "
                  :alt="student.name"
                />
              </div>
            </div>
          </figure>
          <div class="card-body items-center text-center">
            <h2 class="card-title">{{ student.name }}</h2>
            <p>{{ student.email }}</p>
            <div class="card-actions">
              <button class="btn btn-primary btn-sm">
                <nuxt-link
                  :to="localePath(`/parent/student_info/${student.id}`)"
                >
                  {{ $t("parent.dashboard.view_details") }}
                </nuxt-link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">{{ $t("parent.dashboard.welcome") }}</h2>
        <p>{{ $t("parent.dashboard.no_students") }}</p>
      </div>
    </div>
  </div>
</template>
