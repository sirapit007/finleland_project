<template>
  <div
    class="flex-1 flex shrink-0 items-center gap-1 sm:gap-2"
  >
    <label
      class="whitespace-nowrap text-[10px] font-semibold text-base-content/65 sm:text-xs"
      :for="selectId"
    >
      {{ label }}
    </label>
    <select
      :id="selectId"
      v-model.number="pageSizeModel"
      class="select select-xs w-16 border-base-content/10 bg-base-200 font-semibold shadow-sm sm:w-20 sm:select-sm"
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
