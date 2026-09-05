<template>
  <form class="admin-table-search" role="search" @submit.prevent="submit">
    <label class="admin-table-search-field">
      <input
        v-model="draft"
        type="search"
        :name="name"
        :placeholder="placeholder"
        :aria-label="ariaLabel || placeholder"
        :disabled="disabled"
        autocomplete="off"
      />
      <Icon name="lucide:search" size="17" aria-hidden="true" />
    </label>
    <button
      type="submit"
      class="admin-table-search-submit"
      :disabled="disabled"
    >
      ค้นหา
    </button>
    <button
      type="button"
      class="admin-table-search-clear"
      :disabled="disabled || (!draft && !modelValue)"
      @click="clear"
    >
      <Icon name="lucide:rotate-cw" size="15" aria-hidden="true" />ล้างการค้นหา
    </button>
  </form>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    name?: string;
    disabled?: boolean;
  }>(),
  { placeholder: "ค้นหา...", ariaLabel: "", name: "q", disabled: false },
);
const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [value: string];
}>();
const draft = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => {
    draft.value = value;
  },
);
function submit() {
  if (props.disabled) return;
  const value = draft.value.trim();
  draft.value = value;
  emit("update:modelValue", value);
  emit("search", value);
}
function clear() {
  draft.value = "";
  submit();
}
</script>
