<template>
  <AuthBothModal ref="signModal" />

  <header class="shrink-0 border-b border-base-300 bg-base-100">
    <div
      class="overflow-hidden bg-primary transition-[max-height,opacity,transform] duration-300 ease-out"
      :class="
        isTopBarVisible
          ? 'max-h-9 translate-y-0 opacity-100'
          : 'max-h-0 -translate-y-2 opacity-0 pointer-events-none'
      "
    >
      <div
        class="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <span class="text-xs text-primary-content/80">Finleland Plaza</span>

        <div class="flex items-center gap-10" v-if="isLoggedIn">
          <NuxtLink
            v-if="user?.role === 'Admin'"
            to="/admin/login"
            class="text-xs text-secondary/90 hover:underline inline font-semibold"
          >
            เข้าใช้ Admin Panel
          </NuxtLink>
        </div>
        <div v-else class="flex items-center gap-1">
          <button
            class="btn btn-xs btn-link text-primary-content no-underline"
            @click="onSignUp"
          >
            สมัครสมาชิก
          </button>
          <button
            class="btn btn-xs btn-link text-primary-content no-underline"
            @click="onSignIn"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>

    <div
      class="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8"
    >
      <NuxtLink to="/" class="shrink-0" aria-label="หน้าแรก">
        <img
          src="@/assets/images/logo.png"
          alt="Finleland Plaza"
          class="lg:h-24 sm:h-22 h-20 w-auto object-contain"
        />
      </NuxtLink>

      <nav class="lg:flex hidden items-center gap-5" aria-label="เมนูหลัก">
        <NuxtLink
          v-for="menu in menus"
          :key="menu.path"
          :to="menu.path"
          class="text-sm transition-colors hover:text-primary"
          :class="route.path === menu.path ? 'font-semibold text-primary' : ''"
        >
          {{ menu.title }}
        </NuxtLink>
        <template v-if="isLoggedIn">
          <NuxtLink
            to="/shopping-basket"
            class="flex items-center gap-1 text-sm transition-colors hover:text-primary"
            :class="
              route.path === '/shopping-basket'
                ? 'font-semibold text-primary'
                : ''
            "
          >
            <Icon name="lucide:shopping-cart" size="16" />
            ตะกร้าสินค้า
            <span
              class="badge badge-sm rounded-full text-xs"
              :class="
                route.path === '/shopping-basket'
                  ? 'badge-primary'
                  : 'badge-secondary'
              "
            >
              {{ itemCount }}
            </span>
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="flex items-center gap-1 text-sm transition-colors hover:text-primary"
            :class="
              route.path === '/orders'
                ? 'font-semibold text-primary'
                : ''
            "
          >
            เช็คสถานะการจัดซื้อ/จัดส่ง
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="flex items-center gap-1 text-sm transition-colors hover:text-primary"
            :class="
              route.path === '/contact'
                ? 'font-semibold text-primary'
                : ''
            "
          >
            ติดต่อเรา
          </NuxtLink>
        </template>
      </nav>

      <div
        class="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
        v-if="isLoggedIn"
      >
        <NuxtLink
          to="/profile"
          class="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-base-200"
          :class="route.path === '/profile' ? 'bg-primary/10 text-primary' : ''"
          title="โปรไฟล์"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary"
          >
            <img
              v-if="lineProfileImageUrl && !hasLineProfileImageError"
              :src="lineProfileImageUrl"
              alt="รูปโปรไฟล์ LINE"
              class="size-full object-cover"
              @error="hasLineProfileImageError = true"
            />
            <Icon v-else name="lucide:user-round" size="16" />
          </div>
          <div class="min-w-0 text-left">
            <p class="max-w-24 truncate text-sm font-semibold sm:max-w-36">
              {{ user?.firstname }} {{ user?.lastname }}
            </p>
            <p
              class="hidden max-w-40 truncate text-[11px] text-base-content/55 2xl:block"
            >
              {{ user?.email }}
            </p>
          </div>
        </NuxtLink>
        <button
          class="btn btn-ghost btn-square btn-sm text-error"
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
          @click="onSignOut"
        >
          <Icon name="lucide:log-out" size="18" />
        </button>
      </div>
    </div>
  </header>

  <div class="fab fixed bottom-5 right-5 z-50 lg:hidden">
    <div
      tabindex="0"
      role="button"
      class="btn btn-lg btn-circle btn-primary shadow"
      aria-label="เปิดเมนู"
    >
      <Icon name="lucide:menu" size="20" />
    </div>
    <div class="fab-close">
      <span class="btn btn-circle btn-lg btn-error"
        ><Icon name="lucide:x" size="20"
      /></span>
    </div>
    <div
      v-for="menu in menus"
      class="tooltip tooltip-left"
      :data-tip="menu.title"
    >
      <NuxtLink
        :key="`fab-${menu.path}`"
        :to="menu.path"
        class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow border border-primary"
        :title="menu.title"
        :aria-label="menu.title"
      >
        <Icon :name="menu.icon" size="20" />
      </NuxtLink>
    </div>
    <template v-if="isLoggedIn"> </template>
    <div class="tooltip tooltip-left" data-tip="ตะกร้าสินค้า">
      <NuxtLink
        to="/shopping-basket"
        class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow border border-primary"
        title="ตะกร้าสินค้า"
        aria-label="ตะกร้าสินค้า"
      >
        <Icon name="lucide:shopping-cart" size="20" />
        <span
          class="badge badge-secondary badge-xs absolute -right-1 -top-1 rounded-full"
        >
          {{ itemCount }}
        </span>
      </NuxtLink>
    </div>
    <div class="tooltip tooltip-left" data-tip="เช็คสถานะการจัดซื้อ/จัดส่ง">
      <NuxtLink
        to="/orders"
        class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow border border-primary"
        title="เช็คสถานะการจัดซื้อ/จัดส่ง"
        aria-label="เช็คสถานะการจัดซื้อ/จัดส่ง"
      >
        <Icon name="lucide:truck" size="20" />
      </NuxtLink>
    </div>
    <div class="tooltip tooltip-left" data-tip="ติดต่อเรา">
      <NuxtLink
        to="/contact"
        class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow border border-primary"
        title="ติดต่อเรา"
        aria-label="ติดต่อเรา"
      >
        <Icon name="lucide:message-square-text" size="20" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
type SignModalHandle = {
  onSignIn: () => void;
  onSignUp: () => void;
};

const signModal = ref<SignModalHandle | null>(null);
const isTopBarVisible = ref(true);
const { itemCount } = useBasket();
const lineAccounts = useLineAccountsState();
const { clearCurrentUser, syncFromStorage, user } = useCurrentUser();
const route = useRoute();
const hasLineProfileImageError = ref(false);
let isHeaderMounted = false;
let loadedLineAccountUserUuid = "";
let scrollContainer: HTMLElement | null = null;
let scrollAnimationFrame: number | null = null;

const menus = [
  { path: "/", title: "หน้าแรก", icon: "lucide:house" },
  { path: "/products", title: "สินค้าทั้งหมด", icon: "lucide:store" },
  {
    path: "/how-to-order",
    title: "วิธีการสั่งซื้อ",
    icon: "lucide:circle-help",
  },
];

const isLoggedIn = computed(() => Boolean(user.value));
const activeLineAccount = computed(
  () => lineAccounts.value.find((account) => account.line_is_connected) || null,
);
const lineProfileImageUrl = computed(() => {
  const url = String(activeLineAccount.value?.line_picture_url || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
});

const loadHeaderLineAccount = async () => {
  const userUuid = String(user.value?.uuid || "");
  if (!userUuid) {
    loadedLineAccountUserUuid = "";
    lineAccounts.value = [];
    return;
  }
  if (loadedLineAccountUserUuid === userUuid) return;

  loadedLineAccountUserUuid = userUuid;

  try {
    await fetchLineAccounts();
  } catch {
    loadedLineAccountUserUuid = "";
    // The header can continue using the default user icon if LINE is unavailable.
  }
};

const updateTopBarVisibility = () => {
  if (scrollAnimationFrame) {
    return;
  }

  scrollAnimationFrame = requestAnimationFrame(() => {
    isTopBarVisible.value = (scrollContainer?.scrollTop || 0) <= 8;
    scrollAnimationFrame = null;
  });
};

onMounted(() => {
  syncFromStorage();
  isHeaderMounted = true;
  void loadHeaderLineAccount();

  scrollContainer = document.querySelector("main");
  scrollContainer?.addEventListener("scroll", updateTopBarVisibility, {
    passive: true,
  });
  updateTopBarVisibility();
});

watch(
  () => user.value?.uuid,
  (userUuid, previousUserUuid) => {
    if (!isHeaderMounted || userUuid === previousUserUuid) return;
    void loadHeaderLineAccount();
  },
);

watch(lineProfileImageUrl, () => {
  hasLineProfileImageError.value = false;
});

onBeforeUnmount(() => {
  scrollContainer?.removeEventListener("scroll", updateTopBarVisibility);
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
  }
});

const onSignIn = () => {
  signModal.value?.onSignIn();
};

const onSignUp = () => {
  signModal.value?.onSignUp();
};

const onSignOut = async () => {
  await $fetch("/api/auth/logout", { method: "POST" });
  lineAccounts.value = [];
  clearCurrentUser();
  await navigateTo("/");
};
</script>
