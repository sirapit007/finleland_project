<template>
  <!-- {{ query }} -->
  <div
    class="relative w-full"
    @keydown.arrow-down.prevent="focusNext"
    @keydown.arrow-up.prevent="focusPrev"
    @keydown.enter.prevent="selectFocused"
  >
    <input
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'input input-sm w-full input-bordered transition-colors duration-150',
        disabled
          ? 'input-disabled bg-base-200 cursor-not-allowed'
          : 'bg-base-100',
      ]"
      v-model="query"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
      class="w-full"
      autocomplete="off"
      :aria-expanded="open"
      :aria-haspopup="'listbox'"
      role="combobox"
    />

    <button
      v-if="!disabled && !!query"
      class="btn btn-xs btn-ghost btn-error absolute right-1 top-1"
      v-on:click="onClearSelect()"
    >
      <!-- v-on:click="fnItem.onRemoveRow(i as number)" -->
      ✕
    </button>

    <transition name="fade">
      <div
        v-if="open && (filteredOptions.length > 0 || loading)"
        class="absolute z-20 mt-1 max-h-40 w-full rounded-box border border-base-content/10 bg-base-100 shadow-lg"
      >
        <ul
          ref="dropdownList"
          class="max-h-40 w-full overflow-y-auto p-1"
          role="listbox"
          @scroll="onDropdownScroll"
        >
          <li
            v-for="(option, index) in filteredOptions"
            :key="optionKey(option, index)"
            :class="[
              'rounded-lg',
              focusedIndex === index
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-200',
            ]"
            class="cursor-pointer"
            @mousedown.prevent="onSelect(option)"
            @mousemove="focusedIndex = index"
            role="option"
            :aria-selected="focusedIndex === index"
          >
            <span class="block px-3 py-2 text-xs">{{
              optionLabel(option)
            }}</span>
          </li>

          <!-- Loading indicator -->
          <li
            v-if="loading && filteredOptions.length > 0"
            class="px-3 py-2 text-center"
          >
            <span class="text-xs text-base-content/60">กำลังโหลด...</span>
          </li>

          <!-- No results -->
          <li
            v-if="!loading && filteredOptions.length === 0"
            class="px-3 py-2 text-center"
          >
            <span class="text-xs text-base-content/60">ไม่พบข้อมูล</span>
          </li>

          <!-- End of results -->
          <li
            v-if="!hasMore && filteredOptions.length > 0 && !loading"
            class="px-3 py-2 text-center"
          >
            <span class="text-xs text-base-content/40">สิ้นสุด</span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
type ComboBoxProps = {
  modelValue?: any;
  fetchUrl?: string;
  placeholder?: string;
  label?: string;
  value?: string;
  disabled?: boolean;
  clearOnSelect?: boolean;
  pageSize?: number;
};

const props = withDefaults(defineProps<ComboBoxProps>(), {
  modelValue: null,
  fetchUrl: "",
  placeholder: "เลือกตัวเลือก...",
  label: "",
  value: "",
  disabled: false,
  clearOnSelect: false,
  pageSize: 50,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "select", value: any): void;
}>();

const open = ref(false);
const query = ref("");
const focusedIndex = ref(0);

const localOptions = ref<any[]>([]);
const loading = ref(false);
const fetchError = ref<string | null>(null);

// Pagination state
const currentPage = ref(1);
const hasMore = ref(true);
const isLoadingMore = ref(false);
const dropdownList = ref<HTMLElement | null>(null);
const hasLoadedInitial = ref(false); // Track if initial load done

const normalizedOptions = computed(() => {
  return (localOptions.value || []).map((option) => {
    return {
      label: String(option[props.label]),
      value: String(option[props.value]),
      raw: option,
    };
  });
});

const loadOptions = async (page: number = 1, append: boolean = false) => {
  if (!props.fetchUrl || loading.value || isLoadingMore.value) return;

  const isFirstPage = page === 1;
  if (isFirstPage) {
    loading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  fetchError.value = null;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append("q", query.value.trim());
    params.append("page", String(page));
    params.append("pageSize", String(props.pageSize));
    if (props.modelValue) {
      params.append("current", String(props.modelValue));
    }

    // ต่อ query string ลงไปใน URL
    const url = `${props.fetchUrl}?${params.toString()}`;

    const res: any = await $fetch(url);

    const newRows = res.rows || [];

    if (append && page > 1) {
      localOptions.value = [...localOptions.value, ...newRows];
    } else {
      localOptions.value = newRows;

      if (props.modelValue) query.value = newRows[0][props.label];
    }

    // Check if there are more results
    hasMore.value = newRows.length === props.pageSize;

    if (isFirstPage) {
      currentPage.value = 1;
      focusedIndex.value = 0;
    }
  } catch (err: any) {
    fetchError.value = err?.message ?? "Failed to fetch";
    if (!append) {
      localOptions.value = [];
    }
    hasMore.value = false;
  } finally {
    loading.value = false;
    isLoadingMore.value = false;
  }
};

onMounted(() => {
  if (props.fetchUrl && !hasLoadedInitial.value && !loading.value) {
    hasLoadedInitial.value = true;
    loadOptions(1, false);
  }
});

const onFocus = () => {
  open.value = true;
};

const onInput = () => {
  open.value = true;
  focusedIndex.value = 0;
  currentPage.value = 1;
  hasMore.value = true;

  // Fetch data on every input change
  if (props.fetchUrl) {
    loadOptions(1, false);
  }
};

const onSelect = (option: {
  label: string;
  value: string;
  raw: any;
}) => {
  // console.log(option);
  emit("update:modelValue", option.value);
  emit("select", option.raw);
  query.value = option.label;
  open.value = false;
};

const onClearSelect = () => {
  emit("update:modelValue", "");
  emit("select", {});
  query.value = "";
  open.value = false;
};

const onBlur = () => {
  setTimeout(() => {
    open.value = false;
  }, 120);
};

const focusNext = () => {
  if (!open.value || normalizedOptions.value.length === 0) return;
  focusedIndex.value =
    (focusedIndex.value + 1) % normalizedOptions.value.length;
};

const focusPrev = () => {
  if (!open.value || normalizedOptions.value.length === 0) return;
  focusedIndex.value =
    (focusedIndex.value - 1 + normalizedOptions.value.length) %
    normalizedOptions.value.length;
};

const selectFocused = () => {
  if (!open.value || normalizedOptions.value.length === 0) return;
  const option = normalizedOptions.value[focusedIndex.value];
  if (option) {
    onSelect(option);
  }
};

// Scroll event handler for infinite scroll
const onDropdownScroll = () => {
  if (
    !dropdownList.value ||
    !hasMore.value ||
    loading.value ||
    isLoadingMore.value
  ) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = dropdownList.value;

  // Check if scrolled to bottom (with 50px threshold)
  const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;

  if (isAtBottom) {
    currentPage.value += 1;
    loadOptions(currentPage.value, true); // Append results
  }
};

const optionLabel = (option: {
  label: string;
  value: string;
  raw: any;
}) => option.label;

const optionKey = (
  option: { label: string; value: string; raw: any },
  index: number,
) => `${option.value}-${index}`;

const findLabelByValue = (value: string) => {
  const match = normalizedOptions.value.find(
    (option) => option.value === value,
  );
  return match ? match.label : String(value ?? "");
};

watch(
  () => props.modelValue,
  (value) => {
    query.value =
      value !== null && value !== undefined ? findLabelByValue(value) : "";
  },
  { immediate: true },
);

// Reset when fetchUrl changes
watch(
  () => props.fetchUrl,
  (v) => {
    if (v) {
      localOptions.value = [];
      currentPage.value = 1;
      hasMore.value = true;
      hasLoadedInitial.value = false; // Reset initial load flag
    } else {
      localOptions.value = [];
      hasLoadedInitial.value = false;
    }
  },
);

// Filtered options based on query
const filteredOptions = computed(() => {
  return normalizedOptions.value;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.01s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
