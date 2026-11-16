<template>
  <div class="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
    <div class="rounded-2xl bg-base-100 p-5 shadow-sm sm:p-8">
      <p v-if="view === 'loading'" role="status">กำลังตรวจสอบข้อมูล LINE...</p>

      <template v-else-if="view === 'duplicate'">
        <h1 class="text-2xl font-bold text-primary">ไม่สามารถสมัครด้วย LINE ได้</h1>
        <p role="alert" class="alert alert-warning mt-5">
          LINE นี้เชื่อมต่อบัญชีอื่นอยู่แล้ว
        </p>
        <NuxtLink to="/auth/line?result=signin" class="btn btn-primary mt-5 w-full">
          ไปหน้าเข้าสู่ระบบ
        </NuxtLink>
      </template>

      <template v-else-if="view === 'unlinked'">
        <h1 class="text-2xl font-bold text-primary">ยังไม่มีบัญชีที่เชื่อม LINE นี้</h1>
        <p class="mt-3 text-sm text-base-content/70">
          สมัครสมาชิกใหม่ หรือเข้าสู่ระบบด้วยบัญชีเดิมแล้วเชื่อม LINE ในหน้าโปรไฟล์
        </p>
        <AuthLineButton class="mt-5" intent="register" />
        <button class="btn btn-outline mt-2 w-full" type="button" @click="showSignin('/profile')">
          เข้าสู่ระบบบัญชีเดิม
        </button>
      </template>

      <AuthSignInForm v-else-if="view === 'signin'" :after-login="signinNext" @update:leaving="showSignup" />
      <AuthSignUpForm
        v-else-if="view === 'signup'"
        :line-signup="lineSignup"
        :line-email="lineEmail"
        after-signup="/"
        @update:leaving="showSignin()"
      />

      <template v-else>
        <h1 class="text-2xl font-bold text-primary">ไม่สามารถดำเนินการด้วย LINE ได้</h1>
        <p role="alert" class="mt-4 text-sm text-base-content/70">{{ errorMessage }}</p>
        <AuthLineButton class="mt-5" intent="login" />
        <AuthLineButton class="mt-2" intent="register" />
        <NuxtLink to="/auth/line?result=signin" class="btn btn-link mt-2 w-full">
          ไปหน้าเข้าสู่ระบบ
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
type View = 'loading' | 'duplicate' | 'unlinked' | 'signin' | 'signup' | 'error';
const route = useRoute();
const { setCurrentUser } = useCurrentUser();
const view = ref<View>('loading');
const lineSignup = ref(false);
const lineEmail = ref('');
const signinNext = ref<'/' | '/profile'>('/');
const errorMessage = ref('กรุณาลองใหม่อีกครั้ง');
let resultRequest = 0;

function showSignin(next: '/' | '/profile' = '/') {
  lineSignup.value = false;
  lineEmail.value = '';
  signinNext.value = next;
  view.value = 'signin';
}

function showSignup() {
  lineSignup.value = false;
  lineEmail.value = '';
  view.value = 'signup';
}

async function handleResult() {
  const request = ++resultRequest;
  const result = String(route.query.result || '');
  lineSignup.value = false;
  lineEmail.value = '';

  if (result === 'duplicate' || result === 'unlinked') {
    view.value = result;
  } else if (result === 'signin') {
    showSignin();
  } else if (result === 'register') {
    view.value = 'loading';
    try {
      const pending = await $fetch<{ pending: boolean; email?: string }>('/api/auth/line/pending');
      if (request !== resultRequest) return;
      if (!pending.pending) {
        errorMessage.value = 'การยืนยัน LINE หมดอายุ กรุณาเริ่มสมัครด้วย LINE ใหม่';
        view.value = 'error';
        return;
      }
      lineSignup.value = true;
      lineEmail.value = pending.email || '';
      view.value = 'signup';
    } catch {
      if (request !== resultRequest) return;
      errorMessage.value = 'ไม่สามารถตรวจสอบสถานะ LINE ได้ กรุณาลองใหม่อีกครั้ง';
      view.value = 'error';
    }
  } else if (result === 'login') {
    view.value = 'loading';
    try {
      const session = await $fetch<{ authenticated: boolean; user?: Record<string, unknown> }>('/api/auth/session');
      if (request !== resultRequest) return;
      if (!session.authenticated || !session.user) throw new Error('Session unavailable');
      setCurrentUser(session.user);
      window.location.assign('/');
    } catch {
      if (request !== resultRequest) return;
      errorMessage.value = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง';
      view.value = 'error';
    }
  } else {
    errorMessage.value = result === 'cancelled'
      ? 'คุณยกเลิกการยืนยัน LINE สามารถลองใหม่ได้'
      : 'ไม่สามารถยืนยัน LINE ได้ กรุณาลองใหม่อีกครั้ง';
    view.value = 'error';
  }
}

onMounted(() => { void handleResult(); });
watch(() => route.query.result, () => { void handleResult(); });
onBeforeUnmount(() => { resultRequest += 1; });
</script>
