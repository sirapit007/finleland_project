<template>
  <AppHeader @toggle-theme="$emit('toggle-theme')" />
  <main class="flex-1 max-h-[calc(100vh-120px)] overflow-y-auto bg-base-100">
    <slot />
    <AppFooter />
  </main>
</template>

<script setup lang="ts">
defineEmits<{
  "toggle-theme": [];
}>();
</script>
