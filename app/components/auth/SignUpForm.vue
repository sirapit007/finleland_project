<template>
  <AuthOtpInput
    v-if="step === 'otp'"
    :key="challenge.challengeId"
    :phone="base.phone"
    :refno="challenge.refno"
    :length="challenge.otpLength"
    :expires-in="challenge.expiresIn"
    :resend-after="challenge.resendAfter"
    :loading="loading"
    :error-message="errorMessage"
    @submit="onVerifyOtp"
    @resend="onResendOtp"
    @back="onBackToForm"
  />
  <template v-else>
    <div class="mb-6">
      <h1 class="mt-2 sm:text-3xl text-2xl font-bold text-primary">
        สมัครสมาชิก
      </h1>
      <p class="mt-2 sm:text-sm text-xs text-base-content/60 font-semibold">
        สร้างบัญชีเพื่อรับสิทธิประโยชน์มากมาย
      </p>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-2" novalidate>
      <div v-if="errorMessage" role="alert" class="alert alert-error">
        <Icon name="lucide:message-circle-x" size="20" />
        <span>{{ errorMessage }}</span>
      </div>
      <div class="grid grid-cols-2 sm:gap-4 gap-2">
        <fieldset class="fieldset">
          <legend class="fieldset-legend sm:text-sm text-xs">ชื่อ</legend>
          <label
            class="input input-sm space-x-2 w-full validator shadow-xs"
          >
            <Icon name="lucide:user-round" size="16" />
            <input
              type="text"
              name="firstname"
              v-model="base.firstname"
              placeholder="ชื่อจริง"
              required
            />
          </label>
          <div class="validator-hint hidden sm:text-sm text-xs">
            กรุณากรอกชื่อจริง
          </div>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend sm:text-sm text-xs">นามสกุล</legend>
          <label
            class="input input-sm space-x-2 w-full validator shadow-xs"
          >
            <Icon name="lucide:user-round" size="16" />
            <input
              type="text"
              name="lastname"
              v-model="base.lastname"
              placeholder="นามสกุล"
              required
            />
          </label>
          <div class="validator-hint hidden sm:text-sm text-xs">
            กรุณากรอกนามสกุล
          </div>
        </fieldset>
      </div>
      <fieldset class="fieldset">
        <legend class="fieldset-legend sm:text-sm text-xs">
          เบอร์โทรศัพท์
        </legend>
        <label
          class="input input-sm space-x-2 w-full validator shadow-xs"
        >
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
          class="mt-1 text-xs text-error sm:text-sm text-xs"
        >
          {{ fieldErrors.phone }}
        </p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend sm:text-sm text-xs">อีเมล</legend>
        <label
          class="input input-sm space-x-2 w-full validator shadow-xs"
        >
          <Icon name="lucide:mail" size="16" />
          <input
            type="email"
            name="email"
            v-model="base.email"
            placeholder="กรอกอีเมลล์"
            required
          />
        </label>
        <div class="validator-hint hidden sm:text-sm text-xs">
          กรุณากรอกที่อยู่อีเมล
        </div>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend sm:text-sm text-xs">รหัสผ่าน</legend>
        <label
          class="input input-sm space-x-2 w-full validator shadow-xs"
        >
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
          class="mt-1 text-xs text-error sm:text-sm text-xs"
        >
          {{ fieldErrors.password }}
        </p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend sm:text-sm text-xs">
          ยืนยันรหัสผ่าน
        </legend>
        <label
          class="input input-sm space-x-2 w-full validator shadow-xs"
        >
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
            <Icon
              v-if="!show.confirmPassword"
              name="lucide:eye-off"
              size="14"
            />
            <Icon v-else name="lucide:eye" size="14" />
          </button>
        </label>
      </fieldset>

      <label class="label cursor-pointer gap-2 sm:text-sm text-xs">
        <input
          v-model="base.acceptPolicy"
          type="checkbox"
          name="acceptPolicy"
          class="checkbox checkbox-primary sm:checkbox-sm checkbox-xs"
        />
        <span class="label-text font-semibold"
          >ฉันยอมรับ <span class="text-primary">ข้อตกลงและเงื่อนไข</span> และ
          <span class="text-primary">นโยบายความเป็นส่วนตัว</span></span
        >
      </label>

      <button
        class="btn btn-primary sm:btn-md btn-sm w-full"
        type="submit"
        :disabled="!base.acceptPolicy || loading"
      >
        {{ loading ? "กำลังส่งรหัส OTP..." : "สมัครสมาชิก" }}
      </button>

      <div
        class="sm:text-sm text-xs text-center flex items-center justify-center gap-1"
      >
        มีบัญชีแล้ว?
        <button
          type="button"
          class="btn sm:btn-md btn-sm btn-link no-underline relative z-10"
          v-on:click="onLeave()"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </form>
  </template>
</template>

<script setup lang="ts">
const emit = defineEmits(["update:leaving"]);

type SignUpStep = "form" | "otp";

type OtpChallenge = {
  challengeId: string;
  refno: string;
  expiresIn: number;
  resendAfter: number;
  otpLength: number;
};

type RegisterResponse = {
  token: string;
  user: Record<string, unknown>;
};

const emptyChallenge = (): OtpChallenge => ({
  challengeId: "",
  refno: "",
  expiresIn: 300,
  resendAfter: 60,
  otpLength: 6,
});

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
const step = ref<SignUpStep>("form");
const challenge = ref<OtpChallenge>(emptyChallenge());
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
    const response = await $fetch<OtpChallenge>("/api/auth/otp/request", {
      method: "POST",
      body: {
        phone,
        email,
      },
    });

    if (!response.challengeId) {
      throw new Error("OTP challenge was not returned");
    }

    challenge.value = response;
    step.value = "otp";
    errorMessage.value = "";
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(
      error,
      "ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่อีกครั้ง",
    );
  } finally {
    loading.value = false;
  }
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as {
    data?: { statusMessage?: string };
    statusMessage?: string;
    message?: string;
  };

  return (
    apiError?.data?.statusMessage ||
    apiError?.statusMessage ||
    apiError?.message ||
    fallback
  );
}

const onVerifyOtp = async (pin: string) => {
  if (loading.value || !challenge.value.challengeId) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const verification = await $fetch<{ verified: boolean }>(
      "/api/auth/otp/verify",
      {
        method: "POST",
        body: {
          challengeId: challenge.value.challengeId,
          pin,
        },
      },
    );

    if (!verification.verified) {
      throw new Error("OTP verification was not completed");
    }

    const response = await $fetch<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: {
        firstname: String(base.value.firstname || "").trim(),
        lastname: String(base.value.lastname || "").trim(),
        phone: String(base.value.phone || "").trim(),
        email: String(base.value.email || "").trim(),
        password: String(base.value.password || ""),
        challengeId: challenge.value.challengeId,
      },
    });

    if (response.token) {
      localStorage.setItem("web-user", JSON.stringify(response.user));
      await window.location.reload();
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(
      error,
      "ไม่สามารถยืนยัน OTP หรือสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง",
    );
  } finally {
    loading.value = false;
  }
};

const onResendOtp = async () => {
  if (loading.value) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $fetch<OtpChallenge>("/api/auth/otp/request", {
      method: "POST",
      body: {
        phone: String(base.value.phone || "").trim(),
        email: String(base.value.email || "").trim(),
      },
    });

    if (!response.challengeId) {
      throw new Error("OTP challenge was not returned");
    }

    challenge.value = response;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(
      error,
      "ไม่สามารถส่งรหัส OTP ใหม่ได้ กรุณาลองอีกครั้ง",
    );
  } finally {
    loading.value = false;
  }
};

const onBackToForm = () => {
  step.value = "form";
  challenge.value = emptyChallenge();
  errorMessage.value = "";
};

const onLeave = async () => {
  emit("update:leaving");
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
  step.value = "form";
  challenge.value = emptyChallenge();
  errorMessage.value = "";
  fieldErrors.phone = "";
  fieldErrors.password = "";
});
</script>
