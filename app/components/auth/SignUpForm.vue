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
          v-model.trim="base.phone"
          placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
          inputmode="numeric"
          autocomplete="tel"
          pattern="[0-9]{10}"
          minlength="10"
          maxlength="10"
          aria-describedby="signup-phone-error"
          @input="fieldErrors.phone = ''"
          required
        />
      </label>
      <p
        v-if="fieldErrors.phone"
        id="signup-phone-error"
        class="mt-1 text-xs text-error"
      >
        {{ fieldErrors.phone }}
      </p>
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
          minlength="6"
          autocomplete="new-password"
          aria-describedby="signup-password-error"
          @input="fieldErrors.password = ''"
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
      <p
        v-if="fieldErrors.password"
        id="signup-password-error"
        class="mt-1 text-xs text-error"
      >
        {{ fieldErrors.password }}
      </p>
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
          minlength="6"
          autocomplete="new-password"
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
      type="submit"
      :disabled="!base.acceptPolicy || loading"
    >
      {{ loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก" }}
    </button>

    <div class="text-sm text-center">
      มีบัญชีแล้ว?
      <button
        type="button"
        class="btn btn-xs text-sm btn-link no-underline relative z-10"
        v-on:click="onLeave()"
      >
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
const fieldErrors = reactive({
  phone: "",
  password: "",
});

const onSubmit = async () => {
  if (loading.value) return;

  errorMessage.value = "";
  fieldErrors.phone = "";
  fieldErrors.password = "";

  const firstname = String(base.value.firstname || "").trim();
  const lastname = String(base.value.lastname || "").trim();
  const phone = String(base.value.phone || "").trim();
  const email = String(base.value.email || "").trim();
  const password = String(base.value.password || "");
  const confirmPassword = String(base.value.confirmPassword || "");

  if (!/^[0-9]{10}$/.test(phone)) {
    fieldErrors.phone = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
  }

  if (password.length < 6) {
    fieldErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  }

  if (fieldErrors.phone || fieldErrors.password) {
    errorMessage.value = fieldErrors.phone || fieldErrors.password;
    return;
  }

  if (!firstname || !lastname || !email || !confirmPassword) {
    errorMessage.value = "คุณยังกรอกข้อมูลไม่ครบ!";
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.value = "รหัสผ่านและการยืนยันรหัสผ่านของคุณไม่ตรงกัน!";
    return;
  }

  if (!base.value.acceptPolicy) {
    errorMessage.value = "กรุณายอมรับข้อตกลงและนโยบายความเป็นส่วนตัว";
    return;
  }

  loading.value = true;
  try {
    const res = await $fetch("/api/auth/register", {
      method: "post",
      body: {
        firstname,
        lastname,
        phone,
        email,
        password,
      },
    });

    if (res.token) {
      localStorage.setItem("web-user", JSON.stringify(res.user));
      await window.location.reload();
    }
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.statusMessage ||
      "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง";
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
    confirmPassword: "",
    acceptPolicy: false,
  };
  show.value = {
    password: false,
    confirmPassword: false,
  };
  loading.value = false;
  errorMessage.value = "";
  fieldErrors.phone = "";
  fieldErrors.password = "";
});
</script>
