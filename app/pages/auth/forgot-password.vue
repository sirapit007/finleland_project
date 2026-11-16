<template>
  <div class="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
    <div class="rounded-2xl bg-base-100 p-5 shadow-sm sm:p-8">
      <template v-if="step === 'phone'">
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">ลืมรหัสผ่าน</h1>
        <p class="mt-3 text-sm text-base-content/70">
          กรอกเบอร์โทรศัพท์ที่ใช้สมัครสมาชิกเพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่
        </p>

        <form class="mt-6 space-y-5" novalidate @submit.prevent="requestOtp">
          <div v-if="errorMessage" role="alert" class="alert alert-error text-sm">
            {{ errorMessage }}
          </div>
          <fieldset class="fieldset">
            <label for="reset-phone" class="fieldset-legend">เบอร์โทรศัพท์</label>
            <input
              id="reset-phone"
              v-model.trim="phone"
              class="input w-full"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              maxlength="10"
              placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
              :disabled="loading"
            />
          </fieldset>
          <button class="btn btn-primary w-full" type="submit" :disabled="loading">
            {{ loading ? 'กำลังส่งรหัส OTP...' : 'ส่งรหัส OTP' }}
          </button>
        </form>
      </template>

      <AuthOtpInput
        v-else-if="step === 'otp' && challenge"
        :key="challenge.challengeId"
        :phone="phone"
        :refno="challenge.refno"
        :length="challenge.otpLength || 6"
        :expires-in="challenge.expiresIn"
        :resend-after="challenge.resendAfter"
        :loading="loading"
        :error-message="errorMessage"
        conditional-delivery
        @submit="verifyOtp"
        @resend="requestOtp"
        @back="backToPhone"
      />

      <template v-else-if="step === 'password'">
        <div class="text-center">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="lucide:lock-keyhole" size="32" />
          </div>
          <h1 class="text-2xl font-bold text-primary sm:text-3xl">ตั้งรหัสผ่านใหม่</h1>
          <p class="mt-3 text-sm text-base-content/70">
            ยืนยัน OTP เรียบร้อยแล้ว กรุณาตั้งรหัสผ่านใหม่ก่อนการยืนยันหมดอายุ
          </p>
        </div>

        <form class="mt-6 space-y-5" novalidate @submit.prevent="resetPassword">
          <div v-if="errorMessage" role="alert" class="alert alert-error text-sm">
            {{ errorMessage }}
          </div>
          <fieldset class="fieldset">
            <label for="reset-password" class="fieldset-legend">รหัสผ่านใหม่</label>
            <input
              id="reset-password"
              v-model="password"
              class="input w-full"
              type="password"
              autocomplete="new-password"
              maxlength="256"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              :disabled="loading"
            />
          </fieldset>
          <fieldset class="fieldset">
            <label for="reset-confirm-password" class="fieldset-legend">ยืนยันรหัสผ่านใหม่</label>
            <input
              id="reset-confirm-password"
              v-model="confirmPassword"
              class="input w-full"
              type="password"
              autocomplete="new-password"
              maxlength="256"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              :disabled="loading"
            />
          </fieldset>
          <button class="btn btn-primary w-full" type="submit" :disabled="loading">
            {{ loading ? 'กำลังตั้งรหัสผ่าน...' : 'ตั้งรหัสผ่านใหม่' }}
          </button>
          <button class="btn btn-ghost w-full" type="button" :disabled="loading" @click="backToPhone">
            ขอรหัส OTP ใหม่
          </button>
        </form>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">ดำเนินการเรียบร้อย</h1>
        <p class="mt-3 text-sm text-base-content/70">
          หากเบอร์นี้ตรงกับบัญชีที่สามารถกู้ได้ รหัสผ่านจะถูกเปลี่ยนแล้ว ลองเข้าสู่ระบบด้วยรหัสผ่านใหม่
        </p>
        <NuxtLink to="/auth/line?result=signin" class="btn btn-primary mt-6 w-full">
          ไปหน้าเข้าสู่ระบบ
        </NuxtLink>
      </template>

      <NuxtLink
        v-if="step !== 'done'"
        to="/auth/line?result=signin"
        class="btn btn-link mt-4 w-full no-underline"
      >
        กลับไปเข้าสู่ระบบ
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
type Challenge = {
  challengeId: string;
  refno?: string;
  otpLength?: number;
  expiresIn: number;
  resendAfter: number;
};

const step = ref<'phone' | 'otp' | 'password' | 'done'>('phone');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const challenge = ref<Challenge | null>(null);
const loading = ref(false);
const errorMessage = ref('');

async function requestOtp() {
  if (loading.value) return;
  errorMessage.value = '';
  if (!/^[0-9]{10}$/.test(phone.value)) {
    errorMessage.value = 'กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก';
    return;
  }

  loading.value = true;
  try {
    const response = await $fetch<Challenge>('/api/auth/password-reset/request', {
      method: 'POST',
      body: { phone: phone.value },
    });
    if (!response.challengeId) throw new Error('Missing challenge');
    challenge.value = response;
    step.value = 'otp';
  } catch {
    errorMessage.value = 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
}

async function verifyOtp(otp: string) {
  if (loading.value || !challenge.value) return;
  errorMessage.value = '';
  loading.value = true;
  try {
    const response = await $fetch<{ verified: boolean }>('/api/auth/password-reset/verify', {
      method: 'POST',
      body: { challengeId: challenge.value.challengeId, phone: phone.value, otp },
    });
    if (!response.verified) throw new Error('OTP verification failed');
    step.value = 'password';
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.status;
    errorMessage.value = status === 429
      ? 'กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่'
      : status === 410 || status === 403
        ? 'การยืนยันหมดอายุหรือไม่สามารถใช้งานได้ กรุณาขอรหัส OTP ใหม่'
        : 'รหัส OTP ไม่ถูกต้องหรือไม่สามารถตรวจสอบได้ กรุณาลองใหม่อีกครั้ง';
  } finally {
    loading.value = false;
  }
}

async function resetPassword() {
  if (loading.value || !challenge.value) return;
  errorMessage.value = '';
  if (password.value.length < 6) {
    errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    return;
  }

  loading.value = true;
  try {
    await $fetch('/api/auth/password-reset/complete', {
      method: 'POST',
      body: { challengeId: challenge.value.challengeId, phone: phone.value, password: password.value },
    });
    password.value = '';
    confirmPassword.value = '';
    step.value = 'done';
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.status;
    errorMessage.value = status === 403 || status === 410
      ? 'การยืนยันหมดอายุหรือไม่สามารถใช้งานได้ กรุณาขอรหัส OTP ใหม่'
      : 'ไม่สามารถตั้งรหัสผ่านใหม่ได้ กรุณาลองอีกครั้ง หรือขอรหัส OTP ใหม่';
  } finally {
    loading.value = false;
  }
}

function backToPhone() {
  errorMessage.value = '';
  password.value = '';
  confirmPassword.value = '';
  challenge.value = null;
  step.value = 'phone';
}
</script>
