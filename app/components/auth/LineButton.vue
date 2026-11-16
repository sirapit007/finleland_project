<template>
  <a
    :href="href"
    class="btn btn-sm w-full border-0 bg-[#06c755] text-white hover:bg-[#05b34d] sm:btn-md"
  >
    {{ intent === 'register' ? 'สมัครสมาชิกด้วย LINE' : 'เข้าสู่ระบบด้วย LINE' }}
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{ intent: 'login' | 'register' }>();
const device = ref<'desktop' | 'mobile'>('mobile');
const href = computed(() =>
  `/api/auth/line/start?intent=${props.intent}&device=${device.value}`,
);

onMounted(() => {
  device.value = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop';
});
</script>
