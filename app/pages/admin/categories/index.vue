<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการนี้"
    confirm-text="ยืนยัน"
    @confirm="fnRemove.onSubmit()"
  />

  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create Category</h3>

      <div class="mt-4 space-y-3">
        <ImageUpload v-model="base.form.image_url" />
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อหมวดหมู่</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 40 ตัวอักษร..."
            v-model="base.form.category_name"
          />
        </fieldset>
      </div>

      <div class="modal-action">
        <button class="flex-1 btn btn-sm" @click="baseModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn btn-sm btn-primary"
          type="button"
          @click="fnBase.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <ModalImagePreview v-model="isImagePreviewOpen" :src="imageSrc" />

  <div class="p-4 bg-base-100">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div
        class="flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-0"
      >
        <span class="font-bold text-xl text-primary">Manage Categories</span
        ><span class="font-semibold text-base text-secondary"
          >จัดการรายการหมวดหมู่</span
        >
      </div>
      <div class="flex w-full gap-2 sm:items-center md:w-auto">
        <label
          class="flex-1 input input-xs w-full shadow-sm sm:input-sm md:w-80"
        >
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อหมวดหมู่ หรือคำค้นหา..."
            v-model="q"
          />
        </label>
        <button
          class="sm:flex-none flex-1 btn btn-xs w-full shadow-sm sm:btn-sm sm:w-auto btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มหมวดหมู่
        </button>
      </div>
    </div>
    <div
      class="relative my-1 min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:my-2 md:my-4 md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)]"
    >
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>รูปภาพ</td>
            <td>ชื่อหมวดหมู่</td>
            <td>สร้างโดย / เมื่อ</td>
            <td>แก้ไขโดย / เมื่อ</td>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="6" :image-column="1" />
          <tr
            v-else
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-primary/5"
          >
            <td>{{ row.id }}</td>
            <td>
              <div
                v-if="row.image_url"
                class="h-12 w-12 cursor-pointer"
                v-on:click="fnImage.onOpen(row.image_url)"
              >
                <img :src="row.image_url" class="h-full w-full object-cover" />
              </div>
              <div v-else class="h-12 w-12 cursor-not-allowed">
                <img
                  src="@/assets/images/blank.png"
                  class="h-full w-full object-cover"
                />
              </div>
            </td>
            <td>{{ row.category_name }}</td>
            <td>
              <div>{{ row.created_username ?? row.created_by }}</div>
              <div>
                {{ dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </td>
            <td>
              <div>{{ row.updated_username ?? row.updated_by }}</div>
              <div>
                {{
                  row.updated_at
                    ? dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
                    : ""
                }}
              </div>
            </td>
            <th class="text-end">
              <button
                class="btn btn-xs btn-link"
                v-on:click="fnBase.onEdit(row)"
              >
                แก้ไข
              </button>
              <button
                class="btn btn-xs btn-link btn-error no-underline"
                v-on:click="fnBase.onRemove(row)"
              >
                ลบ
              </button>
            </th>
          </tr>
        </tbody>
      </table>
    </div>
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :disabled="pending"
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const isRemoveConfirmOpen = ref(false);
const isImagePreviewOpen = ref(false);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
});
const remove = ref<any>({
  form: {},
  path: "",
});
const imageSrc = ref("");

const { data, pending, error, refresh } = await useFetch("/api/categories", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
});

const fnBase = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      base.value.method === "post"
        ? "/api/categories"
        : `/api/categories/${base.value.form.uuid}`;

    const res = await $fetch(path, {
      method: base.value.method,
      body: {
        ...base.value.form,
      },
    });

    if (res) {
      baseModal.value?.close();
      refresh();
    }
  },
  onRemove: async (row: any) => {
    base.value.form = { ...row };
    isRemoveConfirmOpen.value = true;
  },
};

const fnRemove = {
  onSubmit: async () => {
    const res = await $fetch(`/api/categories/${base.value.form.uuid}`, {
      method: "delete",
      body: {
        ...base.value.form,
      },
    });

    if (res) {
      refresh();

      isRemoveConfirmOpen.value = false;
    }
  },
};

const fnImage = {
  onOpen: (src: string) => {
    imageSrc.value = src;
    isImagePreviewOpen.value = true;
  },
};
</script>
