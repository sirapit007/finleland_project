<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create User</h3>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">First Name</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.firstname"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Last Name</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.lastname"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Phone</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.phone"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Email</legend>
          <input
            type="email"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.email"
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
          <select
            class="select select-sm w-full text-xs bg-base-200"
            v-model="base.form.role"
          >
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
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div class="space-x-3 flex md:flex-col flex-rows md:items-start items-center">
        <span class="font-bold text-xl text-primary"
          >Take care of system users</span
        ><span class="font-semibold text-base text-secondary"
          >ดูแลผู้ใช้งานระบบ</span
        >
      </div>
      <div
        class="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto"
      >
        <label class="input input-xs w-full shadow-sm sm:input-sm md:w-80">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้งานระบบ หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <button
          class="btn btn-xs w-full shadow-sm sm:btn-sm sm:w-auto btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มผู้ใช้งานระบบ
        </button>
      </div>
    </div>
    <div
      class="relative my-1 min-h-[calc(100dvh-16.5rem)] max-h-[calc(100dvh-16.5rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:my-2 md:my-4 md:min-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-16rem)]"
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
        class="table min-w-max table-zebra bg-base-100 text-xs sm:table-sm table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>First Name</td>
            <td>Last Name</td>
            <td>Phone</td>
            <td>Email</td>
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
            <td>{{ row.firstname }}</td>
            <td>{{ row.lastname }}</td>
            <td>{{ row.phone }}</td>
            <td>{{ row.email }}</td>
            <td>
              <div
                :class="`badge badge-xs font-semibold ${row.role === 'User' ? 'badge-info' : row.role === 'Superuser' ? 'badge-warning' : 'badge-success'}`"
              >
                {{ row.role }}
              </div>
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
                v-on:click="fnRemove.onRemove(row, '/api/user')"
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

const { data, pending, error, refresh } = await useFetch("/api/user", {
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
        ? "/api/user"
        : `/api/user/${base.value.form.uuid}`;

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
};

const fnRemove = {
  onRemove: async (row: any, path: string) => {
    remove.value.path = path;
    remove.value.form = { ...row };
    removeModal.value?.showModal();
  },
  onSubmit: async () => {
    const res = await $fetch(`${remove.value.path}/${remove.value.form.uuid}`, {
      method: "delete",
      body: {
        ...remove.value.form,
      },
    });

    if (res) {
      refresh();

      removeModal.value?.close();
    }
  },
};
</script>
