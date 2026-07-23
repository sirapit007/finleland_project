<template>
  <div class="flex h-dvh min-h-0 flex-col overflow-hidden">
    <AppHeader @toggle-theme="$emit('toggle-theme')" />
    <main class="min-h-0 flex-1 overflow-y-auto bg-base-100">
      <slot />
      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  "toggle-theme": [];
}>();
</script>
