<script setup lang="ts">
interface TeacherProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  interests: string | null;
  teachingAreas: string | null;
  teachingExperience: string | null;
}

defineProps<{
  teacher: TeacherProfile;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="space-y-4">
    <!-- Teacher Header -->
    <div class="flex items-start gap-5">
      <div class="avatar placeholder">
        <div class="bg-neutral text-neutral-content rounded-full w-20 h-20">
          <img
            v-if="teacher.image"
            :src="teacher.image"
            :alt="teacher.name || 'Teacher'"
            class="rounded-full object-cover"
          />
          <span v-else class="text-2xl">
            {{ (teacher.name || "T").slice(0, 1).toUpperCase() }}
          </span>
        </div>
      </div>
      <div>
        <h2 class="text-2xl font-bold">
          {{ teacher.name || "Teacher" }}
        </h2>
        <p class="text-sm opacity-70">{{ teacher.email }}</p>
        <div v-if="teacher.teachingAreas" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="area in teacher.teachingAreas.split(',').map(s => s.trim()).filter(Boolean)"
            :key="area"
            class="badge badge-primary badge-outline badge-sm"
          >
            {{ area }}
          </span>
        </div>
      </div>
    </div>

    <!-- Teacher Profile Details -->
    <div
      v-if="teacher.bio || teacher.teachingExperience || teacher.interests"
      class="card bg-base-200"
    >
      <div class="card-body space-y-4">
        <div v-if="teacher.bio">
          <h3 class="font-semibold mb-1">{{ t("student.teachers.profile_bio") }}</h3>
          <p class="text-sm whitespace-pre-line">{{ teacher.bio }}</p>
        </div>
        <div v-if="teacher.interests">
          <h3 class="font-semibold mb-1">{{ t("student.teachers.profile_interests") }}</h3>
          <p class="text-sm">{{ teacher.interests }}</p>
        </div>
        <div v-if="teacher.teachingExperience">
          <h3 class="font-semibold mb-1">{{ t("student.teachers.profile_teaching_experience") }}</h3>
          <p class="text-sm whitespace-pre-line">{{ teacher.teachingExperience }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
