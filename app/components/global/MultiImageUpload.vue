<script setup lang="ts">
import { normalizeProductImageUrls } from "~/utils/productImages";

const model = defineModel<string[]>({ default: () => [] });

const loading = ref(false);
const isDragging = ref(false);
let dragDepth = 0;
const images = computed(() => normalizeProductImageUrls(model.value));

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const result: any = await $fetch("/api/global/upload", {
    method: "POST",
    body: formData,
  });

  return result.url as string;
}

async function uploadFiles(files: File[]) {
  if (!files.length || loading.value) return;

  loading.value = true;

  try {
    const uploads = await Promise.allSettled(
      files.map((file) => uploadFile(file)),
    );

    const uploadedUrls = uploads.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (uploadedUrls.length) {
      model.value = [...images.value, ...uploadedUrls];
    }
  } finally {
    loading.value = false;
  }
}

async function upload(e: Event) {
  const input = e.target as HTMLInputElement;

  try {
    await uploadFiles(Array.from(input.files || []));
  } finally {
    input.value = "";
  }
}

function hasDraggedFiles(e: DragEvent) {
  return Array.from(e.dataTransfer?.types || []).includes("Files");
}

function onDragEnter(e: DragEvent) {
  if (!hasDraggedFiles(e) || loading.value) return;

  dragDepth += 1;
  isDragging.value = true;
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1);

  if (dragDepth === 0) isDragging.value = false;
}

async function onDrop(e: DragEvent) {
  dragDepth = 0;
  isDragging.value = false;

  const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
    file.type.startsWith("image/"),
  );

  await uploadFiles(files);
}

function removeImage(index: number) {
  model.value = images.value.filter((_, imageIndex) => imageIndex !== index);
}
</script>

<template>
  <div class="space-y-3">
    <div
      class="group relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-300"
      :class="
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-primary/30 bg-base-100 hover:border-primary hover:bg-base-200'
      "
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <label
        class="flex min-h-[14rem] cursor-pointer flex-col items-center justify-center gap-4 px-4 py-8 text-center"
      >
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="upload"
        />

        <div
          class="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div>
          <p class="text-lg font-semibold">อัปโหลดรูปภาพ</p>
          <p class="text-sm text-base-content/60">
            คลิกเพื่อเลือกไฟล์หรือดร็อปภาพหลายไฟล์
          </p>
          <p class="mt-2 text-xs text-base-content/40">
            PNG, JPG, WEBP (สูงสุด 5MB ต่อไฟล์)
          </p>
        </div>
      </label>

      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-base-100/80 backdrop-blur-sm"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    </div>

    <div v-if="images.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(url, index) in images"
        :key="url + index"
        class="relative overflow-hidden rounded-xl border border-primary/30 bg-base-100"
      >
        <img :src="url" class="h-40 w-full object-cover" />

        <button
          type="button"
          @click="removeImage(index)"
          class="absolute right-2 top-2 rounded-full p-2 text-error shadow cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
