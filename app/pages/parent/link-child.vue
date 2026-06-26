<script setup lang="ts">
definePageMeta({
  layout: "parent",
});
const localePath = useLocalePath();
const { t } = useI18n();

const studentName = ref("");
const studentEmail = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const submitRequest = async () => {
  loading.value = true;
  error.value = "";
  try {
    await $fetch("/api/parent/link-request", {
      method: "POST",
      body: {
        studentName: studentName.value,
        studentEmail: studentEmail.value,
      },
    });
    success.value = true;
  } catch (err: any) {
    error.value = err.data?.statusMessage || t("parent.link_child.submit_error");
  } finally {
    loading.value = false;
  }
};

const linkAnother = () => {
  studentName.value = "";
  studentEmail.value = "";
  error.value = "";
  success.value = false;
};
</script>

<template>
  <div class="max-w-md mx-auto mt-10">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <template v-if="success">
          <div class="flex justify-center mb-4">
            <div class="p-4 bg-success/20 rounded-full text-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h2 class="card-title text-2xl justify-center mb-2">
            {{ $t("parent.link_child.success_title") }}
          </h2>
          <p class="text-center text-base-content/70">
            {{ $t("parent.link_child.success_message") }}
          </p>
          <div class="card-actions flex-col mt-6 gap-2">
            <button class="btn btn-primary w-full" @click="linkAnother">
              {{ $t("parent.link_child.link_another") }}
            </button>
            <NuxtLink
              :to="localePath('/parent')"
              class="btn btn-ghost w-full"
            >
              {{ $t("parent.link_child.back_to_dashboard") }}
            </NuxtLink>
          </div>
        </template>

        <template v-else>
          <h2 class="card-title text-2xl mb-2">
            {{ $t("parent.link_child.title") }}
          </h2>
          <p class="mb-4 text-base-content/70">
            {{ $t("parent.link_child.description") }}
          </p>

          <form @submit.prevent="submitRequest" class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">{{
                  $t("parent.link_child.student_name")
                }}</span>
              </label>
              <input
                v-model="studentName"
                type="text"
                :placeholder="$t('parent.link_child.student_name_placeholder')"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">{{
                  $t("parent.link_child.student_email")
                }}</span>
              </label>
              <input
                v-model="studentEmail"
                type="email"
                :placeholder="$t('parent.link_child.student_email_placeholder')"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div v-if="error" class="alert alert-error text-sm">
              {{ error }}
            </div>

            <div class="card-actions justify-end mt-6">
              <button
                type="submit"
                class="btn btn-primary w-full"
                :disabled="loading"
              >
                <span v-if="loading" class="loading loading-spinner"></span>
                {{ $t("parent.link_child.submit") }}
              </button>
            </div>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
