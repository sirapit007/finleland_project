<template>
  <label
    class="input input-xs shadow-sm sm:input-sm"
    :class="widthClass"
  >
    <span class="label"><Icon name="lucide:search" size="16" /></span>
    <input
      :value="modelValue"
      type="search"
      :name="name"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      :disabled="disabled"
      autocomplete="off"
      @input="onInput"
      @keydown.enter="onSearch"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    name?: string;
    disabled?: boolean;
    widthClass?: string;
  }>(),
  {
    placeholder: "ค้นหา...",
    ariaLabel: "",
    name: "q",
    disabled: false,
    widthClass: "w-60",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [value: string];
}>();

const onInput = (event: Event) => {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
};

const onSearch = (event: Event) => {
  emit("search", (event.target as HTMLInputElement).value);
};
</script>
