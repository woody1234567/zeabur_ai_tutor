<script setup lang="ts">
import { signIn } from "../../lib/auth-client";

const { data: setupStatus } = await useFetch("/api/auth/setup-status");
const isSetup = computed(() => !setupStatus.value?.hasUsers);

const handleGoogleLogin = async () => {
  await signIn.social({
    provider: "google",
    callbackURL: "/login-success",
  });
};
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col text-center">
      <div class="max-w-md">
        <template v-if="isSetup">
          <h1 class="text-5xl font-bold">{{ $t("auth.setup_title") }}</h1>
          <p class="py-6">
            {{ $t("auth.setup_description") }}
          </p>
          <div class="badge badge-primary badge-lg mb-4">
            {{ $t("auth.setup_badge") }}
          </div>
        </template>
        <template v-else>
          <h1 class="text-5xl font-bold">{{ $t("auth.title") }}</h1>
          <p class="py-6">
            {{ $t("auth.description") }}
          </p>
        </template>
      </div>
      <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
        <div class="card-body">
          <div class="form-control mt-6 gap-2 flex justify-center">
            <button
              @click="handleGoogleLogin"
              class="btn btn-primary flex items-center justify-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.274 47.249 -26.734 49.069 -26.734 51.129 C -26.734 53.189 -26.274 55.009 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.769 C -12.984 43.769 -11.424 44.369 -10.174 45.569 L -6.744 42.139 C -8.804 40.219 -11.514 39.019 -14.754 39.019 C -19.444 39.019 -23.494 41.719 -25.464 45.639 L -21.484 48.729 C -20.534 45.879 -17.884 43.769 -14.754 43.769 Z"
                  />
                </g>
              </svg>
              {{ isSetup ? $t("auth.setup_google_login") : $t("auth.google_login") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
