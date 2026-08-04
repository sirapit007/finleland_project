<template>
  <dialog ref="restoreModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันที่จะกู้คืนรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-question-mark"
          class="text-success"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button class="flex-1 btn btn-sm" @click="restoreModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn btn-sm btn-success"
          type="button"
          @click="fnRestore.onSubmit()"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </dialog>

  <div class="min-h-full p-4 pb-6">
    <div class="flex justify-between gap-3 md:flex-row md:items-center">
      <div class="space-x-3 flex flex-col items-start">
        <span class="font-bold sm:text-xl text-lg text-primary"
          >Restore Categories</span
        ><span class="font-semibold sm:text-base text-sm text-secondary"
          >กู้คืนรายการหมวดหมู่</span
        >
      </div>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm mt-2">
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อหมวดหมู่ หรือคำค้นหา..."
        />
      </div>

      <div class="relative my-1 overflow-auto">
        <p v-if="error" class="text-error">{{ error.message }}</p>

        <table
          class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-xs table-pin-rows table-pin-cols"
        >
          <thead class="text-xs">
            <tr>
              <td>#</td>
              <td>ชื่อหมวดหมู่</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="5" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
            >
              <td>{{ row.id }}</td>
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
                  class="btn btn-xs btn-success btn-link"
                  v-on:click="fnBase.onRestore(row)"
                >
                  กู้คืน
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TablePageSize
          v-model:page-size="pageSize"
          :disabled="pending"
          @update:page-size="page = 1"
        />
        <TablePagination v-model:page="page" :disabled="pending" :data="data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const restoreModal = ref<HTMLDialogElement | null>(null);

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

const { data, pending, error, refresh } = await useFetch("/api/categories", {
  server: false,
  query: {
    page,
    pageSize,
    q,
    deleted: true,
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
  onRestore: async (row: any) => {
    base.value.form = { ...row };
    restoreModal.value?.showModal();
  },
};

const fnRestore = {
  onSubmit: async () => {
    const res = await $fetch(`/api/categories/${base.value.form.uuid}`, {
      method: "put",
      body: {
        ...base.value.form,
      },
    });

    if (res) {
      refresh();

      restoreModal.value?.close();
    }
  },
};
</script>
