<template>
  <div class="mb-6">
    <h1 class="mt-2 text-3xl font-bold text-primary">สมัครสมาชิก</h1>
    <p class="mt-2 text-sm text-base-content/60 font-semibold">
      สร้างบัญชีเพื่อรับสิทธิประโยชน์มากมาย
    </p>
  </div>

  <form @submit.prevent="onSubmit" class="space-y-4" novalidate>
    <div v-if="errorMessage" role="alert" class="alert alert-error">
      <Icon name="lucide:message-circle-x" size="20" />
      <span>{{ errorMessage }}</span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">ชื่อ</legend>
        <label class="input input-sm space-x-2 w-full validator shadow-xs">
          <Icon name="lucide:user-round" size="16" />
          <input type="text" name="firstname" v-model="base.firstname" placeholder="ชื่อจริง" />
        </label>
        <div class="validator-hint hidden">กรุณากรอกชื่อจริง</div>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">นามสกุล</legend>
        <label class="input input-sm space-x-2 w-full validator shadow-xs">
          <Icon name="lucide:user-round" size="16" />
          <input type="text" name="lastname" v-model="base.lastname" placeholder="นามสกุล" />
        </label>
        <div class="validator-hint hidden">กรุณากรอกนามสกุล</div>
      </fieldset>
    </div>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
      <label class="input input-sm space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:phone" size="16" />
        <input
          type="tel"
          name="phone"
          v-model="base.phone"
          placeholder="กรอกเบอร์โทรศัพท์"
          pattern="[0-9]*"
          maxlength="10"
          required
        />
      </label>
      <div class="validator-hint hidden">กรุณากรอกเบอร์โทรศัพท์</div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">อีเมล</legend>
      <label class="input input-sm space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:mail" size="16" />
        <input
          type="email"
          name="email"
          v-model="base.email"
          placeholder="กรอกอีเมลล์"
          required
        />
      </label>
      <div class="validator-hint hidden">กรุณากรอกที่อยู่อีเมล</div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">รหัสผ่าน</legend>
      <label class="input input-sm space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:lock-keyhole" size="16" />
        <input
          :type="show.password ? 'text' : 'password'"
          name="password"
          v-model="base.password"
          placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
          required
        />
        <button
          type="button"
          class="btn btn-xs btn-link"
          v-on:click="show.password = !show.password"
        >
          <Icon v-if="!show.password" name="lucide:eye-off" size="14" />
          <Icon v-else name="lucide:eye" size="14" />
        </button>
      </label>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">ยืนยันรหัสผ่าน</legend>
      <label class="input input-sm space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:lock-keyhole" size="16" />
        <input
          :type="show.confirmPassword ? 'text' : 'password'"
          name="confirmPassword"
          v-model="base.confirmPassword"
          placeholder="ยืนยันรหัสผ่าน"
          required
        />
        <button
          type="button"
          class="btn btn-xs btn-link"
          v-on:click="show.confirmPassword = !show.confirmPassword"
        >
          <Icon v-if="!show.confirmPassword" name="lucide:eye-off" size="14" />
          <Icon v-else name="lucide:eye" size="14" />
        </button>
      </label>
    </fieldset>

    <label class="label cursor-pointer gap-2">
      <input
        v-model="base.acceptPolicy"
        type="checkbox"
        name="acceptPolicy"
        class="checkbox checkbox-primary checkbox-sm"
      />
      <span class="label-text text-xs font-semibold"
        >ฉันยอมรับ <span class="text-primary">ข้อตกลงและเงื่อนไข</span> และ
        <span class="text-primary">นโยบายความเป็นส่วนตัว</span></span
      >
    </label>

    <button
      class="btn btn-primary w-full"
      type="button"
      :disabled="!base.acceptPolicy || loading"
    >
      สมัครสมาชิก
    </button>

    <div class="text-sm text-center">
      มีบัญชีแล้ว?
      <button class="btn btn-xs text-sm btn-link no-underline relative z-10" v-on:click="onLeave()">
        เข้าสู่ระบบ
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits(["update:leaving"]);

const base = ref<any>({
  firstname: "",
  lastname: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptPolicy: false,
});
  
const show = ref<any>({
  password: false,
  confirmPassword: false,
});

const loading = ref<boolean>(false);
const errorMessage = ref<string>("");

const onSubmit = async () => {
  if (
    !base.value.password ||
    !base.value.confirmPassword ||
    base.value.password !== base.value.confirmPassword
  ) {
    errorMessage.value = "รหัสผ่านและการยืนยืนยันรหัสผ่านของคุณไม่ตรงกัน!";
    return;
  }

  if (
    base.value.firstname === "" ||
    base.value.lastname === "" ||
    base.value.phone === "" ||
    base.value.email === ""
  ) {
    errorMessage.value = "คุณยังกรอกข้อมูลไม่ครบ!";
    return;
  }

  errorMessage.value = "";
  loading.value = true;
  try {
    const res = await $fetch("/api/auth/register", {
      method: "post",
      body: { ...base.value },
    });

    if (res.token) {
      localStorage.setItem("web-user", JSON.stringify(res.user));
      await window.location.reload()
    }
  } catch (error: any) {
    errorMessage.value = error;
  } finally {
    loading.value = false;
  }
};

const onLeave = async () => {
  emit("update:leaving")
};

onMounted(() => {
  base.value = {
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    password: "",
    rememberMe: false,
  };
  show.value = {
    password: false,
    confirmPassword: false,
  };
  loading.value = false;
  errorMessage.value = "";
});
</script>
