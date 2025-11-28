<script setup lang="ts">
import { signIn } from "../../lib/auth-client";

const handleGoogleLogin = async () => {
  await signIn.social({
    provider: "google",
    callbackURL: "/login-success",
  });
};

const handleLineLogin = async () => {
  await signIn.social({
    provider: "line",
    callbackURL: "/login-success",
  });
};
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse">
      <div class="text-center lg:text-left">
        <h1 class="text-5xl font-bold">Login now!</h1>
        <p class="py-6">
          Access the AI Learning Assistant to start solving problems and getting
          smart explanations.
        </p>
      </div>
      <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
        <div class="card-body">
          <div class="form-control mt-6 gap-2">
            <button @click="handleGoogleLogin" class="btn btn-primary">
              Login with Google
            </button>
            <button
              @click="handleLineLogin"
              class="btn btn-primary bg-[#06C755] hover:bg-[#05b34c] border-[#06C755] hover:border-[#05b34c] text-white"
            >
              Login with Line
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
