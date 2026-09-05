<template>
  <button
    type="button"
    role="switch"
    class="admin-table-toggle"
    :class="{ 'is-active': modelValue }"
    :aria-checked="modelValue"
    :aria-label="label"
    :aria-busy="pending"
    :title="
      pending ? 'กำลังบันทึก...' : modelValue ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
    "
    :disabled="disabled || pending"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="admin-table-toggle-thumb">
      <Icon
        v-if="pending"
        name="lucide:loader-circle"
        size="12"
        class="animate-spin"
        aria-hidden="true"
      />
    </span>
  </button>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    label: string;
    pending?: boolean;
    disabled?: boolean;
  }>(),
  { pending: false, disabled: false },
);
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
