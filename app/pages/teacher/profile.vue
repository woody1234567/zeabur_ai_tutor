<script setup lang="ts">
definePageMeta({ layout: "teacher" });

const { t } = useI18n();

interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  gender: string | null;
  bio: string | null;
  interests: string | null;
  teachingAreas: string | null;
  teachingExperience: string | null;
}

const { data: profile, status } = await useFetch<ProfileData>(
  "/api/teacher/profile"
);

const form = reactive({
  name: "",
  gender: "",
  bio: "",
  interests: "",
  teachingAreas: "",
  teachingExperience: "",
});

const avatarPreview = ref<string | null>(null);
const avatarUploading = ref(false);
const avatarError = ref("");
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref("");

watchEffect(() => {
  if (profile.value) {
    form.name = profile.value.name || "";
    form.gender = profile.value.gender || "";
    form.bio = profile.value.bio || "";
    form.interests = profile.value.interests || "";
    form.teachingAreas = profile.value.teachingAreas || "";
    form.teachingExperience = profile.value.teachingExperience || "";
    avatarPreview.value = profile.value.image;
  }
});

async function handleAvatarUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    avatarError.value = t("teacher.profile.avatar_upload_error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = t("teacher.profile.avatar_too_large");
    return;
  }

  avatarError.value = "";
  avatarUploading.value = true;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const result = await $fetch<{ imageUrl: string }>(
      "/api/teacher/profile/avatar",
      { method: "POST", body: formData }
    );
    avatarPreview.value = result.imageUrl;
  } catch {
    avatarError.value = t("teacher.profile.avatar_upload_error");
  } finally {
    avatarUploading.value = false;
    input.value = "";
  }
}

async function handleSave() {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = "";

  try {
    const result = await $fetch<ProfileData>("/api/teacher/profile", {
      method: "PUT",
      body: {
        name: form.name,
        gender: form.gender || null,
        bio: form.bio || null,
        interests: form.interests || null,
        teachingAreas: form.teachingAreas || null,
        teachingExperience: form.teachingExperience || null,
      },
    });
    if (result) {
      form.name = result.name || "";
      form.gender = result.gender || "";
      form.bio = result.bio || "";
      form.interests = result.interests || "";
      form.teachingAreas = result.teachingAreas || "";
      form.teachingExperience = result.teachingExperience || "";
    }
    saveSuccess.value = true;
    setTimeout(() => (saveSuccess.value = false), 3000);
  } catch {
    saveError.value = t("teacher.profile.save_error");
  } finally {
    saving.value = false;
  }
}

const genderOptions = computed(() => [
  { value: "", label: t("teacher.profile.gender_options.") },
  { value: "male", label: t("teacher.profile.gender_options.male") },
  { value: "female", label: t("teacher.profile.gender_options.female") },
  { value: "other", label: t("teacher.profile.gender_options.other") },
]);
</script>

<template>
  <div class="container mx-auto max-w-2xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">{{ t("teacher.profile.title") }}</h1>
      <p class="text-sm opacity-70 mt-1">
        {{ t("teacher.profile.description") }}
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="status === 'pending'"
      class="flex items-center justify-center gap-3 py-16"
    >
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <div v-else class="space-y-8">
      <!-- Avatar -->
      <div class="flex items-center gap-6">
        <div class="avatar placeholder">
          <div
            class="bg-neutral text-neutral-content rounded-full w-24 h-24"
          >
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Avatar"
              class="rounded-full object-cover"
            />
            <span v-else class="text-3xl">
              {{ (form.name || "T").slice(0, 1).toUpperCase() }}
            </span>
          </div>
        </div>
        <div>
          <label class="btn btn-outline btn-sm" :class="{ loading: avatarUploading }">
            <span v-if="avatarUploading">{{ t("teacher.profile.uploading_avatar") }}</span>
            <span v-else>{{ t("teacher.profile.change_avatar") }}</span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              :disabled="avatarUploading"
              @change="handleAvatarUpload"
            />
          </label>
          <p v-if="avatarError" class="text-error text-sm mt-1">
            {{ avatarError }}
          </p>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSave" class="space-y-5">
        <div class="grid grid-cols-[8rem_1fr] gap-x-6 gap-y-4">
          <!-- Name -->
          <label class="text-right font-medium text-sm self-center">
            {{ t("teacher.profile.name_label") }} <span class="text-error">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input input-bordered"
            :placeholder="t('teacher.profile.name_placeholder')"
            required
            maxlength="100"
          />

          <!-- Gender -->
          <label class="text-right font-medium text-sm self-center">
            {{ t("teacher.profile.gender_label") }}
          </label>
          <select v-model="form.gender" class="select select-bordered">
            <option
              v-for="opt in genderOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>

          <!-- Interests -->
          <label class="text-right font-medium text-sm self-center">
            {{ t("teacher.profile.interests_label") }}
          </label>
          <input
            v-model="form.interests"
            type="text"
            class="input input-bordered"
            :placeholder="t('teacher.profile.interests_placeholder')"
          />

          <!-- Teaching Areas -->
          <label class="text-right font-medium text-sm self-center">
            {{ t("teacher.profile.teaching_areas_label") }}
          </label>
          <input
            v-model="form.teachingAreas"
            type="text"
            class="input input-bordered"
            :placeholder="t('teacher.profile.teaching_areas_placeholder')"
          />

          <!-- Bio -->
          <label class="text-right font-medium text-sm pt-3">
            {{ t("teacher.profile.bio_label") }}
          </label>
          <textarea
            v-model="form.bio"
            class="textarea textarea-bordered h-32"
            :placeholder="t('teacher.profile.bio_placeholder')"
            maxlength="2000"
          ></textarea>

          <!-- Teaching Experience -->
          <label class="text-right font-medium text-sm pt-3">
            {{ t("teacher.profile.teaching_experience_label") }}
          </label>
          <textarea
            v-model="form.teachingExperience"
            class="textarea textarea-bordered h-32"
            :placeholder="t('teacher.profile.teaching_experience_placeholder')"
            maxlength="2000"
          ></textarea>
        </div>

        <!-- Alerts -->
        <div v-if="saveSuccess" class="alert alert-success">
          <span>{{ t("teacher.profile.save_success") }}</span>
        </div>
        <div v-if="saveError" class="alert alert-error">
          <span>{{ saveError }}</span>
        </div>

        <!-- Save -->
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="saving"
        >
          <span
            v-if="saving"
            class="loading loading-spinner loading-sm"
          ></span>
          {{ saving ? t("teacher.profile.saving") : t("teacher.profile.save") }}
        </button>
      </form>
    </div>
  </div>
</template>
