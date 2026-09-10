<template>
  <div :data-theme="theme" class="min-h-dvh flex flex-col">
    <!-- <button class="btn" @click="theme = theme === 'light' ? 'dark' : 'light'">
      Toggle Theme
    </button> -->

    <!-- <NuxtLoadingIndicator /> -->

    <NuxtLayout @toggle-theme="toggleTheme">
      <NuxtPage />
    </NuxtLayout>

    <div v-if="toast" class="toast toast-top toast-end z-50 w-[calc(100%-2rem)] max-w-sm sm:w-auto">
      <div class="alert shadow-lg" :class="toastClass">
        <Icon :name="toastIcon" size="20" />
        <span>{{ toast.message }}</span>
        <NuxtLink
          v-if="toast.action"
          :to="toast.action.to"
          class="link shrink-0 text-xs font-bold"
          @click="dismissToast"
        >
          {{ toast.action.label }}
        </NuxtLink>
        <button class="btn btn-ghost btn-circle btn-xs" aria-label="Close notification" @click="dismissToast">
          <Icon name="lucide:x" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const theme = ref("finlyland");
const { dismissToast, toast } = useToast();

const toastClass = computed(() => ({
  "alert-success": toast.value?.type === "success",
  "alert-error": toast.value?.type === "error",
  "alert-info": toast.value?.type === "info",
  "alert-warning": toast.value?.type === "warning",
}));
const toastIcon = computed(() => {
  if (toast.value?.type === "error") {
    return "lucide:circle-x";
  }

  if (toast.value?.type === "info") {
    return "lucide:info";
  }

  if (toast.value?.type === "warning") {
    return "lucide:triangle-alert";
  }

  return "lucide:circle-check-big";
});

function toggleTheme() {
  theme.value = theme.value === "finlyland" ? "dark" : "finlyland";
}
</script>
