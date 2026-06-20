<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create Category</h3>

      <div class="mt-4 space-y-3">
        <ImageUpload v-model="base.form.image_url" />
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Category Name</legend>
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

  <dialog ref="removeModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันการลบรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-warning"
          class="text-error"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button class="flex-1 btn btn-sm" @click="removeModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn btn-sm btn-error"
          type="button"
          @click="fnRemove.onSubmit()"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="imageModal" class="modal">
    <div class="modal-box max-w-lg">
      <form method="dialog">
        <button
          class="btn btn-xs btn-circle btn-neutral absolute right-2 top-2"
        >
          ✕
        </button>
      </form>

      <div class="h-100">
        <img :src="imageSrc" class="h-full w-full object-contain" />
      </div>
    </div>
  </dialog>

  <div class="p-4 bg-base-100">
    <div class="flex md:flex-row flex-col justify-between">
      <div class="space-x-3 xl:flex grid">
        <span class="font-bold text-xl text-primary">Manage Categories</span
        ><span class="font-semibold text-base text-secondary"
          >จัดการรายการหมวดหมู่</span
        >
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-60">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อหมวดหมู่ หรือคำค้นหา..."
            v-model="q"
          />
        </label>
        <button
          class="btn sm:btn-sm btn-xs btn-primary shadow-sm"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มหมวดหมู่
        </button>
      </div>
    </div>
    <div
      class="min-h-[calc(100dvh-12.5rem)] max-h-[calc(100dvh-12.5rem)] overflow-y-auto overflow-x-auto my-4 relative border border-base-content/10 rounded-lg shadow-sm"
      :class="pending ? 'backdrop-blur-sm' : ''"
    >
      <p
        v-if="pending"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/75 text-4xl font-bold z-20"
      >
        Loading...
      </p>
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table table-zebra sm:table-sm table-xs table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>Image</td>
            <td>Name</td>
            <td>Created</td>
            <td>Updated</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr
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
            <td class="text-end">
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
            </td>
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
const removeModal = ref<HTMLDialogElement | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

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
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      baseModal.value?.close();
      refresh();
    }
  },
  onRemove: async (row: any) => {
    base.value.form = { ...row };
    removeModal.value?.showModal();
  },
};

const fnRemove = {
  onSubmit: async () => {
    const res = await $fetch(`/api/categories/${base.value.form.uuid}`, {
      method: "delete",
      body: {
        ...base.value.form,
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      refresh();

      removeModal.value?.close();
    }
  },
};

const fnImage = {
  onOpen: (src: string) => {
    imageSrc.value = src;
    imageModal.value?.showModal();
  },
};
</script>
