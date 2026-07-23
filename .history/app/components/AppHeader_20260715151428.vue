<template>
  <dialog ref="signInModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-sm btn-circle absolute right-4 top-4">×</button>
      </form>
      <ModalSignIn :key="signInKey" @update:leaving="onSignUp" />
    </div>
  </dialog>

  <dialog ref="signUpModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-sm btn-circle absolute right-4 top-4">×</button>
      </form>
      <ModalSignUp :key="signUpKey" @update:leaving="onSignIn" />
    </div>
  </dialog>

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
        <NuxtLink
          v-if="isLoggedIn"
          to="/products"
          class="hidden text-xs text-primary-content/90 hover:underline sm:inline"
        >
          เช็คสถานะการจัดซื้อ/จัดส่ง
        </NuxtLink>
        <span v-else class="text-xs text-primary-content/80"
          >Finleland Plaza</span
        >

        <div v-if="!isLoggedIn" class="flex items-center gap-1">
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
          class="lg:h-20 sm:h-18 h-16 w-auto object-contain"
        />
      </NuxtLink>

      <nav class="hidden items-center gap-5 xl:flex" aria-label="เมนูหลัก">
        <NuxtLink
          v-for="menu in menus"
          :key="menu.path"
          :to="menu.path"
          class="text-sm transition-colors hover:text-primary"
          :class="route.path === menu.path ? 'font-semibold text-primary' : ''"
        >
          {{ menu.title }}
        </NuxtLink>
        <NuxtLink
          v-if="isLoggedIn"
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
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Icon name="lucide:user-round" size="16" />
          </div>
          <div class="min-w-0 text-left">
            <p class="max-w-24 truncate text-xs font-semibold sm:max-w-36">
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

  <div class="fab fixed bottom-5 right-5 z-50 xl:hidden">
    <div
      tabindex="0"
      role="button"
      class="btn btn-lg btn-circle btn-primary shadow-lg"
      aria-label="เปิดเมนู"
    >
      <Icon name="lucide:menu" size="22" />
    </div>
    <NuxtLink
      v-for="menu in menus"
      :key="`fab-${menu.path}`"
      :to="menu.path"
      class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow-lg"
      :title="menu.title"
      :aria-label="menu.title"
    >
      <Icon :name="menu.icon" size="20" />
    </NuxtLink>
    <NuxtLink
      v-if="isLoggedIn"
      to="/shopping-basket"
      class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow-lg"
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
    <NuxtLink
      v-if="isLoggedIn"
      to="/profile"
      class="btn btn-circle btn-lg border-base-300 bg-base-100 shadow-lg"
      title="โปรไฟล์"
      aria-label="โปรไฟล์"
    >
      <Icon name="lucide:user-round" size="20" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const signInModal = ref<HTMLDialogElement | null>(null);
const signUpModal = ref<HTMLDialogElement | null>(null);
const signInKey = ref(0);
const signUpKey = ref(0);
const isTopBarVisible = ref(true);
const { itemCount, refreshBasket } = useBasket();
const { clearCurrentUser, syncFromStorage, user } = useCurrentUser();
const route = useRoute();
let basketRefreshTimer: ReturnType<typeof setInterval> | null = null;
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

  scrollContainer = document.querySelector("main");
  scrollContainer?.addEventListener("scroll", updateTopBarVisibility, {
    passive: true,
  });
  updateTopBarVisibility();

  void refreshBasket().catch(() => undefined);
  basketRefreshTimer = setInterval(() => {
    void refreshBasket().catch(() => undefined);
  }, 30_000);
});

onBeforeUnmount(() => {
  if (basketRefreshTimer) {
    clearInterval(basketRefreshTimer);
  }
  scrollContainer?.removeEventListener("scroll", updateTopBarVisibility);
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
  }
});

const onSignIn = () => {
  signUpModal.value?.close();
  signInKey.value += 1;
  signInModal.value?.showModal();
};

const onSignUp = () => {
  signInModal.value?.close();
  signUpKey.value += 1;
  signUpModal.value?.showModal();
};

const onSignOut = async () => {
  await $fetch("/api/auth/logout", { method: "POST" });
  clearCurrentUser();
  await navigateTo("/");
};
</script>
