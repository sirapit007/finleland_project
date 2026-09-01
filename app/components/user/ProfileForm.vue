<template>
  <p
    v-if="profileError"
    class="rounded-lg bg-error/10 px-4 py-3 text-sm text-error"
    role="alert"
  >
    {{ profileError }}
  </p>

  <div v-if="!isAdminContext" class="text-right">
    <span class="badge rounded-lg! py-3 font-mono" :class="roleBadgeClass">
      {{ profileForm.role }}
    </span>
  </div>

  <form class="mt-4 space-y-4" @submit.prevent="saveProfile">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">ชื่อ</legend>
      <input
        v-model.trim="profileForm.firstname"
        type="text"
        required
        maxlength="100"
        class="input input-sm w-full"
        placeholder="ชื่อ"
        :disabled="isSavingProfile"
      />
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">นามสกุล</legend>
      <input
        v-model.trim="profileForm.lastname"
        type="text"
        required
        maxlength="100"
        class="input input-sm w-full"
        placeholder="นามสกุล"
        :disabled="isSavingProfile"
      />
    </fieldset>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">เบอร์โทรศัพท์</legend>
        <input
          v-model.trim="profileForm.phone"
          type="tel"
          required
          inputmode="numeric"
          autocomplete="tel"
          pattern="[0-9]{10}"
          minlength="10"
          maxlength="10"
          class="input input-sm w-full"
          placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
          :disabled="isSavingProfile"
        />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">อีเมล</legend>
        <input
          v-model.trim="profileForm.email"
          type="email"
          required
          maxlength="254"
          autocomplete="email"
          class="input input-sm w-full"
          placeholder="name@example.com"
          :disabled="isSavingProfile"
        />
      </fieldset>
    </div>

    <div
      v-if="isAdminContext"
      class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4"
    >
      <fieldset class="fieldset">
        <legend class="fieldset-legend">รหัสผ่าน</legend>
        <input
          v-model="profileForm.password"
          type="password"
          autocomplete="new-password"
          class="input input-sm w-full"
          :placeholder="
            isAdminCreate
              ? 'กำหนดรหัสผ่าน'
              : 'เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน'
          "
          :disabled="isSavingProfile"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">บทบาท</legend>
        <select
          v-model="profileForm.role"
          class="select select-sm w-full bg-base-200 text-xs"
          :disabled="isSavingProfile"
        >
          <option value="" disabled>- เลือกบทบาท -</option>
          <option v-for="role in USER_ROLES" :key="role" :value="role">
            {{ role }}
          </option>
        </select>
      </fieldset>
    </div>

    <button
      class="btn btn-outline btn-primary sm:btn-md! btn-sm! mt-2 w-full"
      type="submit"
      :disabled="isSavingProfile"
    >
      <span v-if="isSavingProfile" class="loading loading-spinner loading-xs" />
      <template v-else>{{ submitLabel }}</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import {
  createUserEditorForm,
  USER_ROLES,
  type AdminUserContext,
  type UserEditorForm,
  type UserRecord,
} from "~/composables/useUsers";

const props = defineProps<{
  adminContext?: AdminUserContext;
}>();

const emit = defineEmits<{
  saved: [row: UserRecord];
  "save-error": [error: unknown, row: UserRecord];
  saving: [value: boolean];
}>();

const { showToast } = useToast();
const { setCurrentUser, syncFromStorage, user: currentUser } = useCurrentUser();

const profileForm = ref<UserEditorForm>(createUserEditorForm());
const profileError = ref("");
const isSavingProfile = ref(false);

const isAdminContext = computed(() => props.adminContext !== undefined);
const isAdminCreate = computed(() => props.adminContext?.mode === "create");
const submitLabel = computed(() => {
  if (!isAdminContext.value) return "บันทึกข้อมูลผู้ใช้";
  return isAdminCreate.value ? "เพิ่มผู้ใช้งาน" : "บันทึกการแก้ไข";
});
const roleBadgeClass = computed(() => {
  if (profileForm.value.role === "User") return "badge-info";
  if (profileForm.value.role === "Superuser") return "badge-warning";
  return "badge-success";
});

const initializeAdminForm = (context: any) => {
  profileError.value = "";
  profileForm.value =
    context.mode === "edit"
      ? createUserEditorForm(context.user)
      : createUserEditorForm();
};

const loadCurrentUser = () => {
  syncFromStorage();

  if (!currentUser.value?.uuid) {
    return false;
  }

  profileForm.value = createUserEditorForm(currentUser.value);
  return true;
};

const saveProfile = async () => {
  if (isSavingProfile.value) return;

  profileError.value = "";

  const firstname = profileForm.value.firstname.trim();
  const lastname = profileForm.value.lastname.trim();
  const phone = profileForm.value.phone.trim();
  const email = profileForm.value.email.trim().toLowerCase();
  const password = profileForm.value.password;
  const role = profileForm.value.role;

  if (!firstname || !lastname || !phone || !email) {
    profileError.value = "กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน";
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    profileError.value = "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขให้ครบ 10 หลัก";
    return;
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    profileError.value = "กรุณากรอกอีเมลให้ถูกต้อง";
    return;
  }

  if (isAdminContext.value && (!role || !USER_ROLES.includes(role))) {
    profileError.value = "กรุณาเลือกบทบาทผู้ใช้งาน";
    return;
  }

  if (isAdminCreate.value && !password) {
    profileError.value = "กรุณากำหนดรหัสผ่าน";
    return;
  }

  const targetUuid =
    props.adminContext?.mode === "edit"
      ? props.adminContext.user.uuid
      : currentUser.value?.uuid;

  if (!isAdminCreate.value && !targetUuid) {
    profileError.value = "ไม่พบข้อมูลผู้ใช้งาน";
    return;
  }

  const body: Record<string, string> = {
    firstname,
    lastname,
    phone,
    email,
  };

  if (isAdminContext.value) {
    body.role = role;
    if (password) body.password = password;
  }

  const path = isAdminCreate.value
    ? "/api/user"
    : `/api/user/${encodeURIComponent(String(targetUuid))}`;
  const method = isAdminCreate.value ? "POST" : "PUT";
  const requestRow: UserRecord = {
    ...(props.adminContext?.mode === "edit" ? props.adminContext.user : {}),
    ...body,
  };

  profileForm.value.phone = phone;
  profileForm.value.email = email;
  isSavingProfile.value = true;
  emit("saving", true);

  try {
    const response = await $fetch<{ row?: UserRecord }>(path, {
      method,
      body,
    });

    if (!response.row) {
      throw new Error("User update returned no user data");
    }

    const savedRow: any = { ...requestRow, ...response.row };
    profileForm.value = createUserEditorForm(savedRow);

    if (isAdminContext.value) {
      emit("saved", savedRow);
    } else {
      const nextUser = { ...currentUser.value, ...savedRow };
      setCurrentUser(nextUser);
      showToast("บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว");
    }
  } catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string } };
    const statusMessage = fetchError.data?.statusMessage;
    profileError.value =
      statusMessage === "Email or phone already exists"
        ? "อีเมลหรือเบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว"
        : statusMessage || "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้";
    emit("save-error", error, requestRow);
  } finally {
    isSavingProfile.value = false;
    emit("saving", false);
  }
};

watch(
  () => props.adminContext,
  (context) => {
    if (context) initializeAdminForm(context);
  },
  { immediate: true },
);

onMounted(async () => {
  if (!isAdminContext.value && !loadCurrentUser()) {
    await navigateTo("/");
  }
});

defineExpose({ onSubmit: saveProfile });
</script>
