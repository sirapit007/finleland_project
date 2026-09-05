<template>
  <div class="admin-table-page-size">
    <label class="whitespace-nowrap" :for="selectId">
      {{ label }}
    </label>
    <select
      :id="selectId"
      v-model.number="pageSizeModel"
      class="select"
      :disabled="disabled"
    >
      <option v-for="option in normalizedOptions" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    pageSize: number;
    disabled?: boolean;
    label?: string;
    options?: number[];
  }>(),
  {
    disabled: false,
    label: "แสดงต่อหน้า:",
    options: () => [10, 20, 50],
  },
);

const emit = defineEmits<{
  "update:pageSize": [value: number];
}>();

const selectId = useId();
const normalizedOptions = computed(() =>
  [...new Set(props.options.filter((option) => Number(option) > 0))].sort(
    (a, b) => a - b,
  ),
);
const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => emit("update:pageSize", value),
});
</script>
