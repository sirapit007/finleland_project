<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create User</h3>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Username</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.username"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Password</legend>
          <input
            type="password"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.password"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Role</legend>
          <select class="select select-sm w-full text-xs bg-base-200" v-model="base.form.role">
            <option value="" disabled>- เลือก role -</option>
            <option value="User">User</option>
            <option value="Superuser">Superuser</option>
            <option value="Admin">Admin</option>
          </select>
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

  <div class="p-4 bg-base-100">
    <div class="flex md:flex-row flex-col justify-between">
      <div class="space-x-3 xl:flex grid">
        <span class="font-bold text-xl text-primary"
          >Take care of system users</span
        ><span class="font-semibold text-base text-secondary"
          >ดูแลผู้ใช้งานระบบ</span
        >
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-68">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้งานระบบ หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <button
          class="btn sm:btn-sm btn-xs btn-primary shadow-sm"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มผู้ใช้งานระบบ
        </button>
      </div>
    </div>
    <div
      class="md:min-h-[calc(100dvh-12.5rem)] sm:min-h-[calc(100dvh-14rem)] min-h-[calc(100dvh-14rem)] md:max-h-[calc(100dvh-12.5rem)] sm:max-h-[calc(100dvh-14rem)] min-h-[calc(100dvh-13.5rem)] overflow-y-auto overflow-x-auto my-4 relative border border-base-content/10 rounded-lg shadow-sm"
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
            <td>Username</td>
            <td>Role</td>
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
            <td>{{ row.username }}</td>
            <td>
              <div :class="`badge badge-xs font-semibold ${row.role === 'User' ? 'badge-info' : row.role === 'Superuser' ? 'badge-warning' : 'badge-success'}`">{{ row.role }}</div>
            </td>
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
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const removeModal = ref<HTMLDialogElement | null>(null);

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

const { data, pending, error, refresh } = await useFetch("/api/users", {
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
    base.value.form = { role: "" };
    base.value.method = "post";
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row, password: "" };
    base.value.method = "put";

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      base.value.method === "post"
        ? "/api/users"
        : `/api/users/${base.value.form.uuid}`;

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
    const res = await $fetch(`/api/users/${base.value.form.uuid}`, {
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
</script>
