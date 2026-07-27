<template>
  <ModalConfirm
    v-model="isRemoveConfirmOpen"
    title="ยืนยันการลบรายการนี้"
    confirm-text="ยืนยัน"
    @confirm="fnRemove.onSubmit()"
  />

  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Create User</h3>

      <p v-if="formError" class="mt-3 text-sm text-error" role="alert">
        {{ formError }}
      </p>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อ</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.firstname"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">นามสกุล</legend>
          <input
            type="text"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.lastname"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
          <input
            v-model.trim="base.form.phone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            pattern="[0-9]{10}"
            minlength="10"
            maxlength="10"
            class="input input-sm w-full"
            placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">อีเมล</legend>
          <input
            type="email"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            v-model="base.form.email"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">รหัสผ่าน</legend>
          <input
            v-model="base.form.password"
            type="password"
            autocomplete="new-password"
            minlength="6"
            class="input input-sm w-full"
            :placeholder="
              base.method === 'post'
                ? 'ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร'
                : 'เว้นว่างหากไม่เปลี่ยนรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)'
            "
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">บทบาท</legend>
          <select
            class="select select-sm w-full text-xs bg-base-200"
            v-model="base.form.role"
          >
            <option value="" disabled>- เลือกบทบาท -</option>
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
          :disabled="isSaving"
          @click="fnBase.onSubmit()"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <template v-else>บันทึก</template>
        </button>
      </div>
    </div>
  </dialog>

  <div class="p-4 bg-base-100">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div
        class="space-x-3 flex md:flex-col flex-rows md:items-start items-center"
      >
        <span class="font-bold text-xl text-primary"
          >Take care of system users</span
        ><span class="font-semibold text-base text-secondary"
          >ดูแลผู้ใช้งานระบบ</span
        >
      </div>
      <div class="flex w-full gap-2 sm:items-center md:w-auto">
        <label
          class="flex-1 input input-xs w-full shadow-sm sm:input-sm md:w-80"
        >
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้งานระบบ หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <button
          class="sm:flex-none flex-1 btn btn-xs w-full shadow-sm sm:btn-sm sm:w-auto btn-primary"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มผู้ใช้งานระบบ
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
            <td>ชื่อ</td>
            <td>นามสกุล</td>
            <td>เบอร์โทรศัพท์</td>
            <td>อีเมล</td>
            <td>บทบาท</td>
            <td>สร้างโดย / เมื่อ</td>
            <td>แก้ไขโดย / เมื่อ</td>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="pending" :columns="9" />
          <tr
            v-else
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
            <th class="text-end">
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
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const isRemoveConfirmOpen = ref(false);
const formError = ref("");
const isSaving = ref(false);

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
    formError.value = "";
    base.value.form = { role: "" };
    base.value.method = "post";
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    formError.value = "";
    base.value.form = { ...row, password: "" };
    base.value.method = "put";

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    if (isSaving.value) return;

    formError.value = "";

    const firstname = String(base.value.form.firstname || "").trim();
    const lastname = String(base.value.form.lastname || "").trim();
    const phone = String(base.value.form.phone || "").trim();
    const email = String(base.value.form.email || "").trim();
    const password = String(base.value.form.password || "");
    const role = String(base.value.form.role || "").trim();
    const isCreate = base.value.method === "post";

    if (
      !firstname ||
      !lastname ||
      !phone ||
      !email ||
      !role ||
      (isCreate && !password)
    ) {
      formError.value = "กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน";
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      formError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
      return;
    }

    if ((isCreate || password) && password.length < 6) {
      formError.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      return;
    }

    const path = isCreate ? "/api/user" : `/api/user/${base.value.form.uuid}`;

    isSaving.value = true;

    try {
      const res = await $fetch(path, {
        method: base.value.method,
        body: {
          ...base.value.form,
          firstname,
          lastname,
          phone,
          email,
          password,
          role,
        },
      });

      if (res) {
        baseModal.value?.close();
        await refresh();
      }
    } catch (error: any) {
      formError.value =
        error?.data?.statusMessage === "Email or phone already exists"
          ? "อีเมลหรือเบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว"
          : "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้ กรุณาตรวจสอบข้อมูลอีกครั้ง";
    } finally {
      isSaving.value = false;
    }
  },
};

const fnRemove = {
  onRemove: async (row: any, path: string) => {
    remove.value.path = path;
    remove.value.form = { ...row };
    isRemoveConfirmOpen.value = true;
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

      isRemoveConfirmOpen.value = false;
    }
  },
};
</script>
