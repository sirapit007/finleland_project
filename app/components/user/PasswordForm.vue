<template>
  <p
    v-if="passwordError"
    class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
  >
    {{ passwordError }}
  </p>

  <form class="mt-4 space-y-4" @submit.prevent="savePassword">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">รหัสผ่านปัจจุบัน</legend>
      <div class="relative">
        <input
          v-model="passwordForm.currentPassword"
          :type="show.currentPassword ? 'text' : 'password'"
          class="input input-sm w-full pr-10"
          autocomplete="current-password"
          placeholder="กรอกรหัสผ่านปัจจุบัน"
          required
        />
        <button
          type="button"
          class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
          aria-label="แสดงหรือซ่อนรหัสผ่านปัจจุบัน"
          @click="show.currentPassword = !show.currentPassword"
        >
          <Icon
            :name="show.currentPassword ? 'lucide:eye' : 'lucide:eye-off'"
            size="15"
          />
        </button>
      </div>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">รหัสผ่านใหม่</legend>
      <div class="relative">
        <input
          v-model="passwordForm.password"
          :type="show.password ? 'text' : 'password'"
          class="input input-sm w-full pr-10"
          autocomplete="new-password"
          minlength="6"
          placeholder="ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
          required
        />
        <button
          type="button"
          class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
          aria-label="แสดงหรือซ่อนรหัสผ่าน"
          @click="show.password = !show.password"
        >
          <Icon
            :name="show.password ? 'lucide:eye' : 'lucide:eye-off'"
            size="15"
          />
        </button>
      </div>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">ยืนยันรหัสผ่านใหม่</legend>
      <div class="relative">
        <input
          v-model="passwordForm.confirmPassword"
          :type="show.confirmPassword ? 'text' : 'password'"
          class="input input-sm w-full pr-10"
          autocomplete="new-password"
          minlength="6"
          placeholder="ยืนยันรหัสผ่านใหม่"
          required
        />
        <button
          type="button"
          class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
          aria-label="แสดงหรือซ่อนการยืนยันรหัสผ่าน"
          @click="show.confirmPassword = !show.confirmPassword"
        >
          <Icon
            :name="show.confirmPassword ? 'lucide:eye' : 'lucide:eye-off'"
            size="15"
          />
        </button>
      </div>
    </fieldset>

    <button
      class="btn btn-outline btn-primary sm:btn-md! btn-sm! mt-2 w-full"
      type="submit"
      :disabled="isSavingPassword"
    >
      <span
        v-if="isSavingPassword"
        class="loading loading-spinner loading-xs"
      />
      <template v-else>บันทึกรหัสผ่านใหม่</template>
    </button>
  </form>
</template>

<script setup lang="ts">
const { showToast } = useToast();
const { syncFromStorage, user: currentUser } = useCurrentUser();

const passwordForm = ref({
  currentPassword: "",
  password: "",
  confirmPassword: "",
});

const show = ref({
  currentPassword: false,
  password: false,
  confirmPassword: false,
});

const passwordError = ref("");

const isSavingPassword = ref(false);

const savePassword = async () => {
  if (isSavingPassword.value) return;

  passwordError.value = "";

  if (!currentUser.value?.uuid) {
    passwordError.value = "ไม่พบข้อมูลผู้ใช้งาน";
    return;
  }

  if (!passwordForm.value.currentPassword) {
    passwordError.value = "กรุณากรอกรหัสผ่านปัจจุบัน";
    return;
  }

  if (passwordForm.value.password.length < 6) {
    passwordError.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    return;
  }

  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    passwordError.value = "รหัสผ่านและการยืนยันรหัสผ่านต้องตรงกัน";
    return;
  }

  isSavingPassword.value = true;

  try {
    await $fetch(`/api/user/${currentUser.value.uuid}/password`, {
      method: "PUT",
      body: passwordForm.value,
    });
    passwordForm.value = {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    };
    show.value = {
      currentPassword: false,
      password: false,
      confirmPassword: false,
    };
    showToast("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    passwordError.value =
      fetchError.data?.statusMessage || "ไม่สามารถเปลี่ยนรหัสผ่านได้";
  } finally {
    isSavingPassword.value = false;
  }
};

onMounted(syncFromStorage);
</script>
