<script setup lang="ts">
const model = defineModel<string>();

const loading = ref(false);

async function upload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (!file) return;

  loading.value = true;

  try {
    const formData = new FormData();

    formData.append("file", file);

    const result: any = await $fetch("/api/global/upload", {
      method: "POST",
      body: formData,
    });

    model.value = result.url;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="m-1 group relative overflow-hidden rounded-lg border-2 border-dashed border-primary/30 bg-base-100 transition-all duration-300 hover:border-primary hover:bg-base-200"
  >
    <label
      class="flex h-80 cursor-pointer flex-col items-center justify-center gap-4"
    >
      <input type="file" accept="image/*" class="hidden" @change="upload" />

      <template v-if="!model">
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

        <div class="text-center">
          <p class="text-lg font-semibold">อัปโหลดรูปภาพ</p>
          <p class="text-sm text-base-content/60">
            ลากและวาง หรือคลิกเพื่อเลือกไฟล์
          </p>
          <p class="mt-2 text-xs text-base-content/40">
            PNG, JPG, WEBP (สูงสุด 5MB)
          </p>
        </div>
      </template>

      <template v-else>
        <div class="relative h-full w-full">
          <img :src="model" class="h-full w-full object-contain" />

          <div
            class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span class="btn btn-primary btn-sm"> เปลี่ยนรูปภาพ </span>
          </div>
        </div>
      </template>
    </label>

    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-base-100/80 backdrop-blur-sm"
    >
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>
