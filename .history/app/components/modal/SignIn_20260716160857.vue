<template>
  <div class="mb-6">
    <h1 class="mt-2 text-3xl font-bold text-primary">เข้าสู่ระบบ</h1>
    <p class="mt-2 text-sm text-base-content/60 font-semibold">
      เข้าสู่ระบบ {{ props.admin ? 'เพื่อเข้าถึง Admin Panel' : 'เพื่อช้อปปิ้งอย่างต่อเนื่อง' }}
    </p>
  </div>

  <form @submit.prevent="onSubmit" class="space-y-6" novalidate>
    <div v-if="errorMessage" role="alert" class="alert alert-error">
      <Icon name="lucide:message-circle-x" size="20" />
      <span>{{ errorMessage }}</span>
    </div>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">อีเมลหรือเบอร์โทรศัพท์</legend>
      <label class="input space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:user-round" size="16" />
        <input
          type="text"
          name="username"
          v-model="base.username"
          placeholder="กรอกอีเมลล์หรือเบอร์โทรศัพท์"
        />
      </label>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">รหัสผ่าน</legend>
      <label class="input space-x-2 w-full validator shadow-xs">
        <Icon name="lucide:lock-keyhole" size="16" />
        <input
          :type="show ? 'text' : 'password'"
          name="password"
          v-model="base.password"
          placeholder="กรอกรหัสผ่าน"
          required
        />
        <button
          type="button"
          class="btn btn-xs btn-link"
          v-on:click="show = !show"
        >
          <Icon v-if="!show" name="lucide:eye-off" size="14" />
          <Icon v-else name="lucide:eye" size="14" />
        </button>
      </label>
    </fieldset>

    <div class="flex items-center justify-between text-sm">
      <label class="label cursor-pointer gap-2">
        <input
          v-model="base.rememberMe"
          type="checkbox"
          name="rememberMe"
          class="checkbox checkbox-primary checkbox-sm"
        />
        <span class="label-text text-xs font-semibold">จำฉันไว้ในระบบ</span>
      </label>

      <NuxtLink
        v-if="!props.admin"
        class="text-primary text-xs font-semibold"
        >
        <!-- to="/admin/forgot-password" -->
        ลืมรหัสผ่าน?
      </NuxtLink>
    </div>

    <button
      class="btn btn-primary w-full"
      :disabled="loading"
    >
      เข้าสู่ระบบ
    </button>

    <div v-if="!props.admin" class="text-sm text-center">
      ยังไม่มีบัญชี?
      <button type="button" class="btn btn-xs text-sm btn-link no-underline relative z-10" v-on:click="onLeave()">
        สมัครสมาชิก
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  admin?: boolean;
}>();
const emit = defineEmits(["update:leaving"]);

const base = ref<any>({
  username: "",
  password: "",
  rememberMe: false,
});

const show = ref(false);
const loading = ref<boolean>(false);
const errorMessage = ref<string>("");

const onSubmit = async () => {
  loading.value = true;
  try {
    const res = await $fetch("/api/auth/login", {
      method: "post",
      body: { ...base.value, admin: props.admin },
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
    username: "",
    password: "",
    rememberMe: false,
  };
  show.value = false;
  loading.value = false;
  errorMessage.value = "";
});
</script>
