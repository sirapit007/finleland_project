<template>
  <main class="grid place-items-center px-4 py-8 bg-primary/50 h-screen">
    <section class="w-full max-w-sm">
      <div
        class="mb-6 shadow-sm rounded-box border border-base-300 bg-base-100 p-5"
      >
        <AuthSignInForm admin />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin-auth",
});
</script>
