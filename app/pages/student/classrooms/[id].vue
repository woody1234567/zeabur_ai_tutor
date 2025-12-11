<script setup lang="ts">
definePageMeta({
  layout: "student",
});
const localePath = useLocalePath();

const route = useRoute();
const classroomId = route.params.id as string;

// Fetch classroom details
const {
  data: classroom,
  refresh,
  error,
} = await useFetch(`/api/student/classrooms/${classroomId}`);

// Fetch homeworks
const { data: homeworks } = await useFetch(
  `/api/student/classrooms/${classroomId}/homeworks`
);

// Fetch posts (Contact Book)
const { data: posts } = await useFetch(
  `/api/teacher/classrooms/${classroomId}/posts`
);
</script>

<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="mb-4">
      <NuxtLink
        :to="localePath('/student/classrooms')"
        class="btn btn-ghost btn-sm gap-2"
      >
        <Icon name="heroicons-solid:arrow-sm-left" />
        {{ $t("student.classrooms.back") }}
      </NuxtLink>
    </div>

    <div v-if="classroom" class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 class="text-3xl font-bold">{{ classroom.name }}</h1>
          <p class="text-lg opacity-70 mt-2">{{ classroom.description }}</p>
        </div>
      </div>

      <!-- Students List (Read Only) -->
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">
            {{ $t("student.classrooms.classmates") }} ({{
              classroom.students.length
            }})
          </h2>

          <div v-if="classroom.students.length > 0" class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("student.classrooms.table.name") }}</th>
                  <th>{{ $t("student.classrooms.table.joined_date") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in classroom.students" :key="student.id">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder">
                        <div
                          class="bg-neutral text-neutral-content rounded-full w-8"
                        >
                          <span v-if="student.image">
                            <img :src="student.image" />
                          </span>
                          <span v-else>{{
                            student.name.charAt(0).toUpperCase()
                          }}</span>
                        </div>
                      </div>
                      <div class="font-bold">{{ student.name }}</div>
                    </div>
                  </td>
                  <td>{{ new Date(student.joinedAt).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <p>{{ $t("student.classrooms.no_students") }}</p>
          </div>
        </div>
      </div>

      <!-- Homeworks List -->
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">
            {{ $t("student.classrooms.homeworks") }}
          </h2>

          <div v-if="homeworks && homeworks.length > 0" class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("student.classrooms.table.title") }}</th>
                  <th>{{ $t("student.classrooms.table.subject") }}</th>
                  <th>{{ $t("student.classrooms.table.deadline") }}</th>
                  <th>{{ $t("student.classrooms.table.created_at") }}</th>
                  <th>{{ $t("student.classrooms.table.actions") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hw in homeworks" :key="hw.id">
                  <td class="font-bold">
                    {{ hw.title || $t("student.classrooms.untitled") }}
                  </td>
                  <td>{{ hw.subject || "-" }}</td>
                  <td>
                    <span
                      :class="{
                        'text-error':
                          hw.deadline && new Date(hw.deadline) < new Date(),
                      }"
                    >
                      {{
                        hw.deadline
                          ? new Date(hw.deadline).toLocaleString()
                          : $t("student.classrooms.no_deadline")
                      }}
                    </span>
                  </td>
                  <td>{{ new Date(hw.createdAt).toLocaleDateString() }}</td>
                  <td>
                    <NuxtLink
                      :to="localePath(`/student/homeworks/${hw.id}`)"
                      class="btn btn-sm btn-primary"
                    >
                      {{ $t("student.classrooms.view_hw") }}
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <p>{{ $t("student.classrooms.no_homeworks") }}</p>
          </div>
        </div>
      </div>

      <!-- Class Materials Section -->
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Class Materials</h2>
          <ClassroomMaterialsList
            :classroom-id="classroomId"
            user-type="student"
          />
        </div>
      </div>

      <!-- Contact Book (Posts) Section -->
      <div class="card bg-base-100 shadow-xl border border-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">
            {{ $t("teacher.classrooms.posts.title", "Contact Book") }}
          </h2>

          <div v-if="posts && posts.length > 0" class="space-y-4">
            <PostsCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :students="classroom.students"
            />
          </div>
          <div v-else class="text-center py-10 opacity-50">
            <p>
              {{ $t("teacher.classrooms.posts.no_posts", "No posts yet") }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span
        >{{ $t("student.classrooms.error_loading") }} {{ error.message }}</span
      >
    </div>

    <div v-else class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  </div>
</template>
