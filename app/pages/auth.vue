<script setup lang="ts">
import { signIn } from "../../lib/auth-client";

const handleGoogleLogin = async () => {
  await signIn.social({
    provider: "google",
    callbackURL: "/",
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
          <div class="form-control mt-6">
            <button @click="handleGoogleLogin" class="btn btn-primary">
              Login with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
