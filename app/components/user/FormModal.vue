<template>
  <dialog ref="dialog" class="modal" @cancel.prevent="close">
    <div class="modal-box max-h-[92dvh] max-w-sm overflow-y-auto">
      <h3 class="text-lg font-bold">
        {{ method === "put" ? "แก้ไขผู้ใช้งานระบบ" : "เพิ่มผู้ใช้งานระบบ" }}
      </h3>

      <p v-if="formError" class="mt-3 text-sm text-error" role="alert">
        {{ formError }}
      </p>

      <div class="mt-4 space-y-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ชื่อ</legend>
          <input
            v-model="form.firstname"
            type="text"
            maxlength="100"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            :disabled="isSaving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">นามสกุล</legend>
          <input
            v-model="form.lastname"
            type="text"
            maxlength="100"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            :disabled="isSaving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
          <input
            v-model.trim="form.phone"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            pattern="[0-9]{10}"
            minlength="10"
            maxlength="10"
            class="input input-sm w-full"
            placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
            :disabled="isSaving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">อีเมล</legend>
          <input
            v-model="form.email"
            type="email"
            maxlength="100"
            autocomplete="email"
            class="input input-sm w-full"
            placeholder="สูงสุด 100 ตัวอักษร..."
            :disabled="isSaving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">รหัสผ่าน</legend>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="6"
            class="input input-sm w-full"
            :placeholder="
              method === 'post'
                ? 'ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร'
                : 'เว้นว่างหากไม่เปลี่ยนรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)'
            "
            :disabled="isSaving"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">บทบาท</legend>
          <select
            v-model="form.role"
            class="select select-sm w-full bg-base-200 text-xs"
            :disabled="isSaving"
          >
            <option value="" disabled>- เลือกบทบาท -</option>
            <option value="User">User</option>
            <option value="Superuser">Superuser</option>
            <option value="Admin">Admin</option>
          </select>
        </fieldset>
      </div>

      <div class="modal-action grid grid-cols-2 gap-3">
        <button
          class="btn btn-sm"
          type="button"
          :disabled="isSaving"
          @click="close"
        >
          ปิด
        </button>
        <button
          class="btn btn-sm btn-primary"
          type="button"
          :disabled="isSaving"
          @click="onSubmit"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:save" size="16" />
          {{ isSaving ? "กำลังบันทึก..." : "บันทึก" }}
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button :disabled="isSaving" aria-label="ปิดหน้าต่าง">ปิด</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
type UserForm = {
  [key: string]: unknown;
  uuid?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
};

const emit = defineEmits<{
  changed: [row: UserForm];
  "save-error": [error: unknown, row: UserForm];
  close: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const form = ref<UserForm>({});
const method = ref<"post" | "put">("post");
const formError = ref("");
const isSaving = ref(false);

const open = () => {
  if (!dialog.value?.open) {
    dialog.value?.showModal();
  }
};

const close = () => {
  if (isSaving.value) return;

  dialog.value?.close();
  emit("close");
};

const onCreate = async () => {
  formError.value = "";
  form.value = { role: "" };
  method.value = "post";
  open();
};

const onEdit = async (row: UserForm) => {
  formError.value = "";
  form.value = { ...row, password: "" };
  method.value = "put";
  open();
};

const onSubmit = async () => {
  if (isSaving.value) return;

  formError.value = "";

  const firstname = String(form.value.firstname || "").trim();
  const lastname = String(form.value.lastname || "").trim();
  const phone = String(form.value.phone || "").trim();
  const email = String(form.value.email || "").trim();
  const password = String(form.value.password || "");
  const role = String(form.value.role || "").trim();
  const isCreate = method.value === "post";

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

  if (!isCreate && !form.value.uuid) {
    formError.value = "ไม่พบ uuid ของผู้ใช้งานที่ต้องการแก้ไข";
    return;
  }

  const row: UserForm = {
    ...form.value,
    firstname,
    lastname,
    phone,
    email,
    password,
    role,
  };
  const path = isCreate
    ? "/api/user"
    : `/api/user/${encodeURIComponent(String(row.uuid))}`;

  isSaving.value = true;

  try {
    const response = await $fetch<{ row?: UserForm }>(path, {
      method: method.value,
      body: row,
    });
    const savedRow = response.row ?? row;

    form.value = { ...savedRow, password: "" };
    emit("changed", { ...savedRow });
    dialog.value?.close();
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    formError.value =
      fetchError.data?.statusMessage === "Email or phone already exists"
        ? "อีเมลหรือเบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว"
        : "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้ กรุณาตรวจสอบข้อมูลอีกครั้ง";
    emit("save-error", error, row);
  } finally {
    isSaving.value = false;
  }
};

defineExpose({
  onCreate,
  onEdit,
  onSubmit,
});
</script>
