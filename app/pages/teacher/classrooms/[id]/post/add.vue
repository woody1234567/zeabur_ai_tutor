<script setup lang="ts">
definePageMeta({
  layout: "teacher",
});

const route = useRoute();
const localePath = useLocalePath();
const classroomId = route.params.id as string;
const router = useRouter();

// Fetch classroom details to get students
const { data: classroom } = await useFetch(
  `/api/teacher/classrooms/${classroomId}`
);

const form = ref({
  date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }),
  startTime: "09:00",
  endTime: "10:00",
  content: "",
  attendees: [] as string[],
  summary: "",
  template: "",
});

const generating = ref(false);
const isSubmitting = ref(false);
const error = ref("");

// Select all students by default when classroom loads
watch(
  classroom,
  (newVal) => {
    if (newVal && newVal.students) {
      form.value.attendees = newVal.students.map((s: any) => s.id);
    }
  },
  { immediate: true }
);

const classLength = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return 0;
  const start = new Date(`2000-01-01T${form.value.startTime}`);
  const end = new Date(`2000-01-01T${form.value.endTime}`);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000)); // minutes
});

const handleBender = async () => {
  if (!form.value.summary || !form.value.template) return;

  generating.value = true;
  error.value = "";

  try {
    const { generatedContent } = await $fetch(
      `/api/teacher/classrooms/${classroomId}/posts/generate`,
      {
        method: "POST",
        body: {
          summary: form.value.summary,
          template: form.value.template,
        },
      }
    );

    if (generatedContent) {
      form.value.content = generatedContent;
    }
  } catch (e: any) {
    console.error("AI Generation failed", e);
    error.value =
      "Failed to generate content with AI. Please try again or type manually.";
  } finally {
    generating.value = false;
  }
};

const submitPost = async () => {
  if (!form.value.content || !form.value.date) {
    error.value = "Content and Date are required";
    return;
  }

  isSubmitting.value = true;
  error.value = "";

  try {
    await $fetch(`/api/teacher/classrooms/${classroomId}/posts`, {
      method: "POST",
      body: {
        content: form.value.content,
        classDate: form.value.date,
        classStartTime: new Date(
          `${form.value.date}T${form.value.startTime}`
        ).toISOString(),
        classEndTime: new Date(
          `${form.value.date}T${form.value.endTime}`
        ).toISOString(),
        attendees: form.value.attendees,
      },
    });
    router.push(localePath(`/teacher/classrooms/${classroomId}`));
  } catch (e: any) {
    error.value = e.message || "Failed to create post";
  } finally {
    isSubmitting.value = false;
  }
};

const toggleAttendee = (studentId: string) => {
  const index = form.value.attendees.indexOf(studentId);
  if (index === -1) {
    form.value.attendees.push(studentId);
  } else {
    form.value.attendees.splice(index, 1);
  }
};

const toggleAllAttendees = () => {
  if (!classroom.value) return;
  if (form.value.attendees.length === classroom.value.students.length) {
    form.value.attendees = [];
  } else {
    form.value.attendees = classroom.value.students.map((s: any) => s.id);
  }
};
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-2xl">
    <div class="mb-6">
      <NuxtLink
        :to="localePath(`/teacher/classrooms/${classroomId}`)"
        class="btn btn-ghost btn-sm gap-2"
      >
        <Icon name="heroicons-solid:arrow-sm-left" class="h-5 w-5 mr-2"></Icon>
        {{ $t("teacher.posts.back", "Back to Classroom") }}
      </NuxtLink>
    </div>

    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body">
        <h1 class="card-title text-2xl mb-6">
          {{ $t("teacher.posts.add_title", "Add New Post") }}
        </h1>

        <form @submit.prevent="submitPost" class="space-y-6">
          <!-- Date and Time -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">
                  {{ $t("teacher.posts.date_label", "Date") }}
                </span>
              </label>
              <input
                type="date"
                v-model="form.date"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">
                  {{ $t("teacher.posts.start_time_label", "Start Time") }}
                </span>
              </label>
              <input
                type="time"
                v-model="form.startTime"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">
                  {{ $t("teacher.posts.end_time_label", "End Time") }}
                </span>
              </label>
              <input
                type="time"
                v-model="form.endTime"
                class="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <!-- Calculated Duration -->
          <div class="alert bg-base-200 py-2">
            <Icon
              name="heroicons-outline:clock"
              class="h-5 w-5 text-primary"
            ></Icon>
            <span
              >{{ $t("teacher.posts.duration", "Duration") }}:
              {{ Math.floor(classLength / 60) }}h {{ classLength % 60 }}m</span
            >
          </div>

          <!-- Summary and Template Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Class Summary</span>
                <span class="label-text-alt text-base-content/70"
                  >Briefly describe today's class</span
                >
              </label>
              <textarea
                v-model="form.summary"
                class="textarea textarea-bordered h-32"
                placeholder="e.g. Covered Chapter 3, assigned exercise 4..."
              ></textarea>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Template</span>
                <span class="label-text-alt text-base-content/70"
                  >Define the structure</span
                >
              </label>
              <textarea
                v-model="form.template"
                class="textarea textarea-bordered h-32"
                placeholder="Topic: ...&#10;Homework: ...&#10;Key points: ..."
              ></textarea>
            </div>
          </div>

          <!-- Bender AI Button -->
          <div class="flex justify-center">
            <button
              type="button"
              class="btn btn-secondary gap-2"
              @click="handleBender"
              :disabled="generating || !form.summary || !form.template"
            >
              <Icon
                v-if="generating"
                name="lucide:loader-2"
                class="size-5 animate-spin"
              />
              <Icon v-else name="lucide:bot" class="size-5" />
              <span>Generate Content with AI</span>
            </button>
          </div>

          <!-- Content Input -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">
                {{ $t("teacher.posts.content_label", "Content / Notes") }}
              </span>
            </label>
            <textarea
              v-model="form.content"
              class="textarea textarea-bordered h-32"
              required
              :placeholder="
                $t(
                  'teacher.posts.content_placeholder',
                  'Enter class notes, homework, or feedback...'
                )
              "
            ></textarea>
          </div>

          <!-- Attendees -->
          <div class="form-control w-full">
            <label class="label cursor-pointer justify-start gap-4">
              <span class="label-text font-bold">
                {{ $t("teacher.posts.attendees_label", "Attendees") }}
              </span>
              <span
                class="label-text text-primary"
                @click="toggleAllAttendees"
                >{{
                  form.attendees.length === classroom?.students.length
                    ? "Deselect All"
                    : "Select All"
                }}</span
              >
            </label>
            <div
              class="border border-base-300 rounded-lg p-2 max-h-48 overflow-y-auto"
            >
              <div v-if="!classroom || classroom.students.length === 0">
                No students
              </div>
              <div
                v-else
                v-for="student in classroom.students"
                :key="student.id"
                class="form-control"
              >
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    :checked="form.attendees.includes(student.id)"
                    @change="toggleAttendee(student.id)"
                    class="checkbox checkbox-sm checkbox-primary"
                  />
                  <span class="label-text">{{ student.name }}</span>
                </label>
              </div>
            </div>
            <label class="label">
              <span class="label-text-alt">
                {{ form.attendees.length }} selected
              </span>
            </label>
          </div>

          <div v-if="error" class="alert alert-error">
            <span>{{ error }}</span>
          </div>

          <div class="card-actions justify-end mt-6">
            <button
              type="button"
              class="btn btn-ghost"
              @click="router.back()"
              :disabled="isSubmitting"
            >
              {{ $t("common.cancel", "Cancel") }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              {{ $t("teacher.posts.submit", "Create Post") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
