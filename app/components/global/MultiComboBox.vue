<template>
  <div
    class="relative w-full"
    @keydown.arrow-down.prevent="focusNext"
    @keydown.arrow-up.prevent="focusPrevious"
    @keydown.enter.prevent="selectFocused"
    @keydown.escape.stop="closeDropdown"
  >
    <div
      :class="[
        'w-full input-bordered duration-150 relative flex min-h-8 w-full flex-wrap items-center gap-1 rounded-field border border-base-content/20 bg-base-100 px-2 py-1 transition-colors',
        disabled
          ? 'cursor-not-allowed bg-base-200 opacity-60 input-disabled bg-base-200 cursor-not-allowed'
          : 'bg-base-100',
      ]"
      @mousedown="focusInput"
    >
      <span
        v-for="option in selectedOptions"
        :key="option.value"
        class="badge badge-primary badge-sm max-w-full gap-1"
      >
        <span class="max-w-40 truncate">{{ option.label }}</span>
        <button
          v-if="!disabled"
          type="button"
          class="btn btn-ghost btn-circle btn-xs h-4 min-h-4 w-4"
          :aria-label="`นำ ${option.label} ออกจากรายการ`"
          @mousedown.prevent
          @click.stop="removeValue(option.value)"
        >
          <Icon name="lucide:x" size="12" />
        </button>
      </span>

      <input
        ref="input"
        v-model="query"
        type="text"
        class="min-w-24 flex-1 bg-transparent px-1 text-xs outline-none"
        :placeholder="selectedValues.length ? '' : placeholder"
        :disabled="disabled"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="listboxId"
        :aria-activedescendant="focusedOptionId"
        @focus="onFocus"
        @input="onInput"
        @blur="onBlur"
        @keydown.backspace="removeLastValue"
      />

      <button
        v-if="!disabled && selectedValues.length"
        type="button"
        class="btn btn-ghost btn-circle btn-error btn-xs absolute right-1 top-1"
        aria-label="ล้างรายการที่เลือกทั้งหมด"
        @mousedown.prevent
        @click.stop="clearSelection"
      >
        <Icon name="lucide:x" size="14" />
      </button>
    </div>

    <transition name="fade">
      <div
        v-if="open"
        class="absolute z-30 mt-1 w-full rounded-box border border-base-content/10 bg-base-100 shadow-lg"
      >
        <ul
          :id="listboxId"
          ref="dropdownList"
          class="max-h-52 w-full overflow-y-auto p-1"
          role="listbox"
          aria-multiselectable="true"
          @scroll="onDropdownScroll"
        >
          <li
            v-for="(option, index) in normalizedOptions"
            :id="optionId(index)"
            :key="option.value"
            :class="[
              'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs',
              focusedIndex === index ? 'bg-primary/15' : 'hover:bg-base-200',
              isSelected(option.value) ? 'font-semibold text-primary' : '',
              isAtSelectionLimit && !isSelected(option.value)
                ? 'cursor-not-allowed opacity-40'
                : '',
            ]"
            role="option"
            :aria-selected="isSelected(option.value)"
            @mousedown.prevent="toggleOption(option)"
            @mousemove="focusedIndex = index"
          >
            <span class="truncate">{{ option.label }}</span>
            <Icon
              v-if="isSelected(option.value)"
              name="lucide:check"
              class="shrink-0"
              size="15"
            />
          </li>

          <template v-if="loading && !normalizedOptions.length">
            <li v-for="item in 4" :key="item" class="px-3 py-2">
              <div class="skeleton h-4" :class="item % 2 ? 'w-4/5' : 'w-2/3'" />
            </li>
          </template>

          <li v-else-if="loadingMore" class="px-3 py-2">
            <div class="skeleton h-3 w-1/2" />
          </li>

          <li
            v-if="!loading && !normalizedOptions.length && !fetchError"
            class="px-3 py-3 text-center text-xs text-base-content/60"
          >
            ไม่พบข้อมูล
          </li>

          <li
            v-if="fetchError"
            class="px-3 py-3 text-center text-xs text-error"
          >
            {{ fetchError }}
          </li>

          <li
            v-if="
              !hasMore &&
              normalizedOptions.length > 0 &&
              !loadingMore &&
              !loading
            "
            class="px-3 py-2 text-center text-xs text-base-content/40"
          >
            สิ้นสุด
          </li>
        </ul>
        <button
          v-if="allowCreate && !disabled"
          type="button"
          class="btn btn-ghost btn-sm w-full justify-start rounded-none border-t border-base-300 text-primary"
          @mousedown.prevent
          @click="requestCreate"
        >
          <Icon name="lucide:plus" size="15" />
          {{ createLabel }}
          <span v-if="query.trim()" class="min-w-0 truncate">
            “{{ query.trim() }}”
          </span>
        </button>

        <p
          v-if="isAtSelectionLimit"
          class="border-t border-base-300 px-3 py-2 text-xs text-warning"
        >
          เลือกได้สูงสุด {{ max }} รายการ
        </p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
type RawOption = Record<string, unknown>;

type NormalizedOption = {
  label: string;
  value: string;
  raw: RawOption;
};

type MultiComboBoxProps = {
  modelValue?: Array<string | number>;
  fetchUrl?: string;
  placeholder?: string;
  label?: string;
  value?: string;
  disabled?: boolean;
  pageSize?: number;
  max?: number;
  closeOnSelect?: boolean;
  debounceMs?: number;
  maxResolvePages?: number;
  allowCreate?: boolean;
  createLabel?: string;
};

type FetchResponse = {
  rows?: RawOption[];
  page?: number | string;
  totalPages?: number | string;
};

const props = withDefaults(defineProps<MultiComboBoxProps>(), {
  modelValue: () => [],
  fetchUrl: "",
  placeholder: "เลือกตัวเลือก...",
  label: "",
  value: "",
  disabled: false,
  pageSize: 50,
  max: 0,
  closeOnSelect: false,
  debounceMs: 250,
  maxResolvePages: 20,
  allowCreate: false,
  createLabel: "เพิ่มรายการใหม่",
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  select: [option: RawOption, selected: boolean];
  change: [value: string[], options: RawOption[]];
  create: [query: string];
}>();

const input = ref<HTMLInputElement | null>(null);
const dropdownList = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref("");
const focusedIndex = ref(0);
const localOptions = ref<RawOption[]>([]);
const optionCache = ref<Record<string, NormalizedOption>>({});
const loading = ref(false);
const loadingMore = ref(false);
const fetchError = ref("");
const currentPage = ref(1);
const hasMore = ref(true);
const hasLoadedInitial = ref(false);
const listboxId = `multi-combobox-${useId()}`;

let optionsRequestId = 0;
let resolveRequestId = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let blurTimer: ReturnType<typeof setTimeout> | undefined;

const selectedValues = computed(() =>
  [...new Set(props.modelValue.map((item) => String(item)))].filter(Boolean),
);

const normalizeOption = (row: RawOption): NormalizedOption | null => {
  const rawValue = row[props.value];
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  const value = String(rawValue);
  return {
    value,
    label: String(row[props.label] ?? value),
    raw: row,
  };
};

const normalizedOptions = computed(() =>
  localOptions.value.flatMap((row) => {
    const option = normalizeOption(row);
    return option ? [option] : [];
  }),
);

const selectedOptions = computed<NormalizedOption[]>(() =>
  selectedValues.value.map(
    (value) =>
      optionCache.value[value] ?? {
        value,
        label: value,
        raw: {
          [props.value]: value,
          [props.label]: value,
        },
      },
  ),
);

const isAtSelectionLimit = computed(
  () => props.max > 0 && selectedValues.value.length >= props.max,
);

const focusedOptionId = computed(() =>
  open.value && normalizedOptions.value[focusedIndex.value]
    ? optionId(focusedIndex.value)
    : undefined,
);

const optionId = (index: number) => `${listboxId}-option-${index}`;

const isSelected = (value: string) => selectedValues.value.includes(value);

const cacheRows = (rows: RawOption[]) => {
  const nextCache = { ...optionCache.value };

  for (const row of rows) {
    const option = normalizeOption(row);
    if (option) nextCache[option.value] = option;
  }

  optionCache.value = nextCache;
};

const mergeRows = (currentRows: RawOption[], newRows: RawOption[]) => {
  const rowsByValue = new Map<string, RawOption>();

  for (const row of [...currentRows, ...newRows]) {
    const option = normalizeOption(row);
    if (option) rowsByValue.set(option.value, row);
  }

  return [...rowsByValue.values()];
};

const createFetchUrl = (page: number, search: string) => {
  const params = new URLSearchParams({
    q: search.trim(),
    page: String(page),
    pageSize: String(props.pageSize),
  });
  const separator = props.fetchUrl.includes("?") ? "&" : "?";
  return `${props.fetchUrl}${separator}${params.toString()}`;
};

const getHasMore = (
  response: FetchResponse,
  page: number,
  rowCount: number,
) => {
  const totalPages = Number(response.totalPages);
  return Number.isFinite(totalPages) && totalPages > 0
    ? page < totalPages
    : rowCount >= props.pageSize;
};

const loadOptions = async (page = 1, append = false) => {
  if (!props.fetchUrl) {
    localOptions.value = [];
    hasMore.value = false;
    return;
  }

  const requestId = ++optionsRequestId;
  fetchError.value = "";

  if (append) loadingMore.value = true;
  else loading.value = true;

  try {
    const response = await $fetch<FetchResponse>(
      createFetchUrl(page, query.value),
    );

    if (requestId !== optionsRequestId) return;

    const rows = response.rows ?? [];
    cacheRows(rows);
    localOptions.value = append ? mergeRows(localOptions.value, rows) : rows;
    currentPage.value = page;
    hasMore.value = getHasMore(response, page, rows.length);
    focusedIndex.value = 0;
  } catch (error: unknown) {
    if (requestId !== optionsRequestId) return;

    const fetchFailure = error as { data?: { statusMessage?: string } };
    fetchError.value =
      fetchFailure.data?.statusMessage || "ไม่สามารถโหลดตัวเลือกได้";
    if (!append) localOptions.value = [];
    hasMore.value = false;
  } finally {
    if (requestId === optionsRequestId) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
};

const resolveSelectedLabels = async () => {
  if (!props.fetchUrl || !selectedValues.value.length) return;

  const requestId = ++resolveRequestId;
  let missingValues = selectedValues.value.filter(
    (value) => !optionCache.value[value],
  );

  for (
    let page = 1;
    page <= props.maxResolvePages && missingValues.length;
    page += 1
  ) {
    try {
      const response = await $fetch<FetchResponse>(createFetchUrl(page, ""));
      if (requestId !== resolveRequestId) return;

      const rows = response.rows ?? [];
      cacheRows(rows);
      missingValues = missingValues.filter(
        (value) => !optionCache.value[value],
      );

      if (!getHasMore(response, page, rows.length)) break;
    } catch {
      return;
    }
  }
};

const selectedRawOptions = (values: string[]) =>
  values.map(
    (value) =>
      optionCache.value[value]?.raw ?? {
        [props.value]: value,
        [props.label]: value,
      },
  );

const updateSelection = (values: string[]) => {
  const normalizedValues = [...new Set(values.map(String))].filter(Boolean);
  emit("update:modelValue", normalizedValues);
  emit("change", normalizedValues, selectedRawOptions(normalizedValues));
};

const resetSearch = () => {
  query.value = "";
  void loadOptions(1, false);
};

const requestCreate = () => {
  if (!props.allowCreate || props.disabled) return;
  open.value = false;
  emit("create", query.value.trim());
};

const refreshOptions = async () => {
  await loadOptions(1, false);
  await resolveSelectedLabels();
};

const addOption = (row: RawOption, select = true) => {
  const option = normalizeOption(row);
  if (!option) return;
  cacheRows([row]);
  localOptions.value = mergeRows([row], localOptions.value);

  if (select && !isSelected(option.value) && !isAtSelectionLimit.value) {
    updateSelection([...selectedValues.value, option.value]);
    emit("select", option.raw, true);
  }
  query.value = "";
  open.value = false;
};
const toggleOption = (option: NormalizedOption) => {
  const selected = isSelected(option.value);
  if (!selected && isAtSelectionLimit.value) return;

  const values = selected
    ? selectedValues.value.filter((value) => value !== option.value)
    : [...selectedValues.value, option.value];

  updateSelection(values);
  emit("select", option.raw, !selected);
  resetSearch();

  if (props.closeOnSelect) open.value = false;
  else nextTick(() => input.value?.focus());
};

const removeValue = (value: string) => {
  if (props.disabled) return;

  const option = optionCache.value[value];
  updateSelection(selectedValues.value.filter((item) => item !== value));
  if (option) emit("select", option.raw, false);
};

const removeLastValue = () => {
  if (query.value || !selectedValues.value.length || props.disabled) return;
  removeValue(selectedValues.value[selectedValues.value.length - 1] ?? "");
};

const clearSelection = () => {
  if (props.disabled) return;
  updateSelection([]);
  resetSearch();
  nextTick(() => input.value?.focus());
};

const focusInput = () => {
  if (!props.disabled) input.value?.focus();
};

const onFocus = () => {
  if (blurTimer) clearTimeout(blurTimer);
  open.value = true;

  if (!hasLoadedInitial.value) {
    hasLoadedInitial.value = true;
    void loadOptions(1, false);
  }
};

const onInput = () => {
  open.value = true;
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    void loadOptions(1, false);
  }, props.debounceMs);
};

const onBlur = () => {
  blurTimer = setTimeout(() => {
    open.value = false;
  }, 150);
};

const closeDropdown = () => {
  open.value = false;
};

const focusNext = () => {
  if (!open.value) {
    open.value = true;
    return;
  }

  if (!normalizedOptions.value.length) return;
  focusedIndex.value =
    (focusedIndex.value + 1) % normalizedOptions.value.length;
};

const focusPrevious = () => {
  if (!open.value) {
    open.value = true;
    return;
  }

  if (!normalizedOptions.value.length) return;
  focusedIndex.value =
    (focusedIndex.value - 1 + normalizedOptions.value.length) %
    normalizedOptions.value.length;
};

const selectFocused = () => {
  if (!open.value) {
    open.value = true;
    return;
  }

  const option = normalizedOptions.value[focusedIndex.value];
  if (option) toggleOption(option);
};

const onDropdownScroll = () => {
  if (
    !dropdownList.value ||
    !hasMore.value ||
    loading.value ||
    loadingMore.value
  ) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = dropdownList.value;
  if (scrollHeight - (scrollTop + clientHeight) < 50) {
    void loadOptions(currentPage.value + 1, true);
  }
};

defineExpose({ refreshOptions, addOption });

onMounted(async () => {
  hasLoadedInitial.value = true;
  await loadOptions(1, false);
  await resolveSelectedLabels();
});

watch(
  () => props.modelValue,
  () => {
    void resolveSelectedLabels();
  },
  { deep: true },
);

watch(
  () => [props.fetchUrl, props.label, props.value],
  () => {
    optionsRequestId += 1;
    resolveRequestId += 1;
    localOptions.value = [];
    optionCache.value = {};
    currentPage.value = 1;
    hasMore.value = true;
    hasLoadedInitial.value = false;
    fetchError.value = "";

    if (props.fetchUrl) {
      hasLoadedInitial.value = true;
      void loadOptions(1, false).then(resolveSelectedLabels);
    }
  },
);

onBeforeUnmount(() => {
  optionsRequestId += 1;
  resolveRequestId += 1;
  if (searchTimer) clearTimeout(searchTimer);
  if (blurTimer) clearTimeout(blurTimer);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.08s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
