<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการนี้"
    confirm-text="ยืนยัน"
    @confirm="fnRemove.onSubmit()"
  />

  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create Supplier</h3>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">รหัสผู้จัดจำหน่าย</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 20 ตัวอักษร..."
            v-model="base.form.supplier_code"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อผู้จัดจำหน่าย</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 150 ตัวอักษร..."
            v-model="base.form.supplier_name"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ที่อยู่ผู้จัดจำหน่าย</legend>
          <textarea
            class="textarea textarea-sm w-full"
            placeholder="กี่ตัวตัวอักษรก็ได้..."
            v-model="base.form.supplier_address"
          ></textarea>
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

  <div class="min-h-full p-4 pb-6">
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="flex justify-between gap-3 md:flex-row md:items-center m-3">
        <div class="space-x-3 flex flex-col items-start">
          <span class="font-bold sm:text-xl text-lg text-primary"
            >Manage Suppliers</span
          ><span class="font-semibold sm:text-base text-sm text-secondary"
            >จัดการรายการผู้จัดจำหน่าย</span
          >
        </div>
        <button
          class="flex-none btn btn-xs shadow-sm sm:btn-sm btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มผู้จัดจำหน่าย
        </button>
      </div>
  
      <div class="flex flex-wrap items-center lg:p-3 sm:p-2 p-1">
        <TableResultSummary :page="page" :page-size="pageSize" :data="data" />
        <TableSearch
          v-model="q"
          placeholder="ค้นหาชื่อผู้จัดจำหน่าย หรือคำค้นหาอื่นๆ..."
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
              <td>รหัส</td>
              <td>ชื่อผู้จัดจำหน่าย</td>
              <td>ที่อยู่</td>
              <td>สร้างโดย / เมื่อ</td>
              <td>แก้ไขโดย / เมื่อ</td>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows v-if="pending" :columns="7" />
            <tr
              v-else
              v-for="row in data?.rows"
              :key="row.id"
              class="hover:bg-primary/5"
            >
              <td>{{ row.id }}</td>
              <td>{{ row.supplier_code }}</td>
              <td>{{ row.supplier_name }}</td>
              <td>{{ row.supplier_address || "-" }}</td>
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
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const isRemoveConfirmOpen = ref(false);

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

const { data, pending, error, refresh } = await useFetch("/api/suppliers", {
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
        ? "/api/suppliers"
        : `/api/suppliers/${base.value.form.uuid}`;

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
    const res = await $fetch(`/api/suppliers/${base.value.form.uuid}`, {
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
</script>
