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
        <button
          class="flex-1 btn btn-sm"
          @click="restoreModal?.close()"
        >
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

  <div class="p-4 bg-base-100">
    <div class="flex sm:flex-row flex-col justify-between">
      <div class="space-x-3">
        <span class="font-bold text-xl text-primary">Restore Suppliers</span
        ><span class="font-semibold text-base text-secondary">กู้คืนรายการผู้จัดจำหน่าย</span>
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-64">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้จัดจำหน่าย หรือคำค้นหา..."
            v-model="q"
          />
        </label>
      </div>
    </div>
    <div
      class="min-h-[calc(100dvh-12.5rem)] max-h-[calc(100dvh-12.5rem)] overflow-auto my-4 relative"
      :class="pending ? 'backdrop-blur-sm' : ''"
    >
      <p
        v-if="pending"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/75 text-4xl font-bold"
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
            <td>Code</td>
            <td>Name</td>
            <td>Address</td>
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

const { data, pending, error, refresh } = await useFetch("/api/suppliers", {
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
        ? "/api/suppliers"
        : `/api/suppliers/${base.value.form.uuid}`;

    const res = await $fetch(path, {
      method: base.value.method,
      body: {
        ...base.value.form
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
    const res = await $fetch(`/api/suppliers/${base.value.form.uuid}`, {
      method: "put",
      body: {
        ...base.value.form
      },
    });

    if (res) {
      refresh();

      restoreModal.value?.close();
    }
  },
};
</script>
