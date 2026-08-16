<template>
  <article>
    <p
      v-if="lineError"
      class="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-content"
    >
      {{ lineError }}
    </p>

    <div v-if="isLineLoading" class="mt-5 space-y-3">
      <SkeletonLineAccounts :count="1" />
    </div>

    <div
      v-else-if="activeLineAccount"
      class="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4"
    >
      <div class="flex items-center gap-3">
        <img
          v-if="activeLineAccount.line_picture_url"
          :src="activeLineAccount.line_picture_url"
          class="size-12 rounded-full border border-base-300 bg-base-100 object-cover"
          alt="LINE profile"
        />
        <div
          v-else
          class="flex size-12 items-center justify-center rounded-full bg-success text-success-content"
        >
          <Icon name="lucide:message-circle" size="23" />
        </div>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate font-bold">
              {{ activeLineAccount.line_display_name || "LINE account" }}
            </p>
            <span class="badge badge-success badge-sm">เชื่อมแล้ว</span>
          </div>
          <p class="mt-1 text-xs text-base-content/55">
            LINE ID:
            {{ maskLineUserId(activeLineAccount.line_user_id) }}
          </p>
        </div>
      </div>
      <div v-if="!adminContext" class="mt-4 flex gap-2">
        <button
          class="btn btn-outline btn-primary btn-sm flex-1"
          :disabled="!isLineConfigured || isLineConnectStarting"
          @click="connectLine"
        >
          <span
            v-if="isLineConnectStarting"
            class="loading loading-spinner loading-xs"
          />
          <template v-else>เชื่อมบัญชีอื่น</template>
        </button>
        <button
          class="btn btn-outline btn-error btn-sm flex-1"
          @click="isLineDisconnectConfirmOpen = true"
        >
          ยกเลิกการเชื่อมต่อ
        </button>
      </div>
    </div>

    <div
      v-else
      class="mt-5 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center"
    >
      <Icon
        name="lucide:bell-ring"
        size="34"
        class="mx-auto mb-3 text-base-content/35"
      />
      <p class="font-semibold">ยังไม่ได้เชื่อมต่อ LINE</p>
      <p class="mx-auto mt-1 max-w-sm text-sm text-base-content/55">
        เชื่อมบัญชี LINE ของคุณเพื่อให้ระบบส่งการแจ้งเตือนคำสั่งซื้อได้
      </p>
      <button
        v-if="!adminContext"
        class="btn btn-success btn-sm mt-4"
        :disabled="!isLineConfigured || isLineConnectStarting"
        @click="connectLine"
      >
        <span
          v-if="isLineConnectStarting"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="lucide:link" size="16" />
        {{ isLineConfigured ? "เชื่อมต่อ LINE" : "กำลังรอการตั้งค่า LINE" }}
      </button>
      <p
        v-if="!adminContext && !isLineConfigured"
        class="mt-3 text-xs text-warning"
      >
        ผู้ดูแลระบบต้องตั้งค่า LINE Login ก่อนเริ่มเชื่อมต่อ
      </p>
    </div>
  </article>

  <ModalRemoveConfirm
    v-if="!adminContext"
    v-model="isLineDisconnectConfirmOpen"
    title="ยืนยันการยกเลิก LINE"
    message="คุณจะไม่ได้รับการแจ้งเตือนคำสั่งซื้อผ่านบัญชี LINE นี้อีกต่อไป"
    confirm-text="ยกเลิกการเชื่อมต่อ"
    variant="error"
    :loading="isLineDisconnecting"
    @confirm="disconnectLine"
  />
</template>

<script setup lang="ts">
const { showToast } = useToast();

const props = defineProps<{
  adminContext?: boolean;
  userUuid?: string;
}>();

const route = useRoute();
const router = useRouter();

const isLineLoading = ref(false);
const isLineConfigured = ref(false);
const isLineConnectStarting = ref(false);
const isLineDisconnecting = ref(false);
const isLineDisconnectConfirmOpen = ref(false);

const lineAccounts = ref<LineAccount[]>([]);
const lineError = ref("");
let lineRequestId = 0;

const activeLineAccount = computed(
  () => lineAccounts.value.find((account) => account.line_is_connected) || null,
);

const loadLineAccounts = async () => {
  const requestId = ++lineRequestId;
  lineError.value = "";
  isLineLoading.value = true;

  if (props.adminContext) {
    lineAccounts.value = [];
  }

  try {
    let rows: LineAccount[];

    if (props.adminContext) {
      const userUuid = String(props.userUuid || "").trim();
      if (!userUuid) {
        lineError.value = "ไม่พบ UUID ของผู้ใช้งาน";
        return;
      }

      const response = await $fetch<{ rows: LineAccount[] }>(
        "/api/user/line-accounts",
        { query: { user_uuid: userUuid } },
      );
      rows = response.rows || [];
    } else {
      rows = await fetchLineAccounts();
    }

    if (requestId === lineRequestId) {
      lineAccounts.value = rows;
    }
  } catch (error: any) {
    if (requestId === lineRequestId) {
      lineError.value =
        error?.data?.statusMessage ||
        "ไม่สามารถโหลดข้อมูลการเชื่อมต่อ LINE ได้";
    }
  } finally {
    if (requestId === lineRequestId) {
      isLineLoading.value = false;
    }
  }
};

const loadLineStatus = async () => {
  try {
    const response = await $fetch<{ configured: boolean }>(
      "/api/user/line-accounts/status",
    );
    isLineConfigured.value = response.configured;
  } catch {
    isLineConfigured.value = false;
  }
};

const handleLineResult = async () => {
  const status = String(route.query.line || "");

  if (!status) {
    return;
  }

  if (status === "connected") {
    showToast("เชื่อมต่อ LINE เรียบร้อยแล้ว");
  } else if (status === "cancelled") {
    lineError.value = "คุณยกเลิกการเชื่อมต่อ LINE";
  } else {
    lineError.value = "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่อีกครั้ง";
  }

  const query = { ...route.query };
  delete query.line;
  await router.replace({ path: route.path, query });
};

const connectLine = () => {
  if (isLineConnectStarting.value) return;

  lineError.value = "";

  if (!isLineConfigured.value) {
    lineError.value = "LINE Login ยังไม่ได้รับการตั้งค่า";
    return;
  }

  isLineConnectStarting.value = true;
  window.location.assign("/api/user/line-accounts/connect");
};

const disconnectLine = async () => {
  if (!activeLineAccount.value || isLineDisconnecting.value) return;

  lineError.value = "";
  isLineDisconnecting.value = true;

  try {
    await disconnectLineAccount(activeLineAccount.value.uuid);
    isLineDisconnectConfirmOpen.value = false;
    showToast("ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว");
    await loadLineAccounts();
  } catch (error: any) {
    const message =
      error?.data?.statusMessage || "ไม่สามารถยกเลิกการเชื่อมต่อ LINE ได้";
    lineError.value = message;
    showToast(message);
  } finally {
    isLineDisconnecting.value = false;
  }
};

const maskLineUserId = (lineUserId: string) => {
  if (lineUserId.length < 12) {
    return lineUserId;
  }

  return `${lineUserId.slice(0, 5)}...${lineUserId.slice(-4)}`;
};

watch(
  [() => props.adminContext, () => props.userUuid],
  async ([isAdminContext]) => {
    if (!isAdminContext) return;
    await loadLineAccounts();
  },
  { immediate: true },
);

onMounted(async () => {
  if (props.adminContext) return;

  await Promise.all([loadLineAccounts(), loadLineStatus()]);
  await handleLineResult();
});
</script>
