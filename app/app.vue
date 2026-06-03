<template>
  <div :data-theme="theme" class="min-h-dvh flex flex-col">
    <!-- <button class="btn" @click="theme = theme === 'light' ? 'dark' : 'light'">
      Toggle Theme
    </button> -->

    <!-- <NuxtLoadingIndicator /> -->

    <NuxtLayout @toggle-theme="toggleTheme">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const theme = ref("finleland");

function toggleTheme() {
  theme.value = theme.value === "finleland" ? "dark" : "finleland";
}
</script>
