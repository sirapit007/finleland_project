<template>
  <AuthBothModal ref="signModal" />

  <div class="drawer drawer-end shrink-0">
    <input
      id="app-header-drawer"
      v-model="isDrawerOpen"
      type="checkbox"
      class="drawer-toggle"
    />

    <div class="drawer-content">
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
                class="text-xs text-accent/80 hover:underline inline"
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

          <nav
            class="flex items-center lg:gap-5 md:gap-5 gap-1.5"
            aria-label="เมนูหลัก"
          >
            <NuxtLink
              v-for="menu in menus"
              :key="menu.path"
              :to="menu.path"
              class="sm:flex hidden justify-center items-center xl:text-sm text-[13px] transition-colors hover:text-primary xl:p-1.5 lg:p-0.5 md:p-2.5 p-1.5"
              :class="
                route.path === menu.path
                  ? 'font-semibold text-primary  bg-primary/10 rounded-lg'
                  : ''
              "
            >
              <span class="lg:hidden inline-flex">
                <Icon :name="menu.icon" size="21" />
              </span>
              <span class="lg:inline-flex hidden">{{ menu.title }}</span>
            </NuxtLink>
            <template v-if="isLoggedIn">
              <NuxtLink
                to="/shopping-basket"
                class="sm:flex hidden items-center gap-1 xl:text-sm text-[13px] transition-colors hover:text-primary xl:p-1.5 lg:p-0.5 md:p-2.5 p-1.5"
                :class="
                  route.path === '/shopping-basket'
                    ? 'font-semibold bg-primary/10 rounded-lg'
                    : ''
                "
              >
                <span class="relative lg:hidden inline-flex">
                  <Icon
                    name="material-symbols:shopping-cart-outline-rounded"
                    size="18"
                  />
                  <span
                    class="absolute -top-1.5 -right-2 w-4 h-4 flex justify-center items-center text-[10px]! rounded-full"
                    :class="
                      route.path === '/shopping-basket'
                        ? 'bg-primary text-primary-content'
                        : 'bg-secondary'
                    "
                  >
                    {{ itemCount }}
                  </span>
                </span>
                <span class="lg:inline-flex hidden gap-1">
                  <span>ตะกร้าสินค้า</span>
                  <span
                    class="badge badge-sm rounded-full"
                    :class="
                      route.path === '/shopping-basket'
                        ? 'badge-primary'
                        : 'badge-secondary'
                    "
                  >
                    {{ itemCount }}
                  </span>
                </span>
              </NuxtLink>
              <NuxtLink
                to="/orders"
                class="sm:flex hidden items-center gap-1 xl:text-sm text-[13px] transition-colors hover:text-primary xl:p-1.5 lg:p-0.5 md:p-2.5 p-1.5"
                :class="
                  route.path === '/orders'
                    ? 'font-semibold text-primary bg-primary/10 rounded-lg'
                    : ''
                "
              >
                <span class="lg:hidden inline-flex">
                  <Icon
                    name="material-symbols:local-shipping-outline-rounded"
                    size="21"
                  />
                </span>
                <span class="lg:inline-flex hidden"
                  >เช็คสถานะการจัดซื้อ/จัดส่ง</span
                >
              </NuxtLink>
              <NuxtLink
                to="/contact"
                class="sm:flex hidden items-center gap-1 xl:text-sm text-[13px] transition-colors hover:text-primary xl:p-1.5 lg:p-0.5 md:p-2.5 p-1.5"
                :class="
                  route.path === '/contact'
                    ? 'font-semibold text-primary bg-primary/10 rounded-lg'
                    : ''
                "
              >
                <span class="lg:hidden inline-flex">
                  <Icon
                    name="material-symbols:chat-outline-rounded"
                    size="21"
                  />
                </span>
                <span class="lg:inline-flex hidden">ติดต่อเรา</span>
              </NuxtLink>
            </template>
          </nav>

          <div
            class="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2"
            v-if="isLoggedIn"
          >
            <div class="sm:hidden inline-flex items-center gap-4">
              <NuxtLink
                to="/shopping-basket"
                class="flex items-center gap-1 text-sm transition-colors hover:text-primary p-2.5"
                :class="
                  route.path === '/shopping-basket'
                    ? 'font-semibold bg-primary/10 rounded-lg'
                    : ''
                "
              >
                <span class="relative lg:hidden inline-flex">
                  <Icon
                    name="material-symbols:shopping-cart-outline-rounded"
                    size="18"
                  />
                  <span
                    class="absolute -top-2 -right-2 w-4 h-4 flex justify-center items-center text-[10px]! rounded-full"
                    :class="
                      route.path === '/shopping-basket'
                        ? 'bg-primary text-primary-content'
                        : 'bg-secondary'
                    "
                  >
                    {{ itemCount }}
                  </span>
                </span>
              </NuxtLink>
              <button
                type="button"
                class="sm:hidden drawer-button btn btn-ghost btn-square btn-sm"
                title="เปิดเมนูด้านข้าง"
                aria-label="เปิดเมนูด้านข้าง"
                aria-controls="app-header-drawer-panel"
                :aria-expanded="isDrawerOpen"
                @click="isDrawerOpen = true"
              >
                <Icon name="lucide:panel-right-open" size="18" />
              </button>
            </div>
            <NuxtLink
              to="/profile"
              class="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-base-200"
              :class="
                route.path === '/profile' ? 'bg-primary/10 text-primary' : ''
              "
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
                <p class="truncate text-sm font-semibold sm:max-w-36 max-w-12">
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
              class="btn btn-ghost btn-square btn-sm text-error sm:block hidden"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              @click="onSignOut"
            >
              <Icon name="lucide:log-out" size="18" />
            </button>
          </div>
        </div>
      </header>
    </div>

    <div class="drawer-side z-50">
      <label
        for="app-header-drawer"
        aria-label="ปิดเมนูด้านข้าง"
        class="drawer-overlay"
      ></label>

      <aside
        id="app-header-drawer-panel"
        class="flex h-dvh w-[min(24rem,90vw)] flex-col overflow-y-auto border-l border-base-300 bg-base-100 shadow-2xl w-full"
        aria-label="เมนูด้านข้าง"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 px-5 py-4"
        >
          <div>
            <p class="text-xs font-medium tracking-wide text-primary uppercase">
              Finleland Plaza
            </p>
            <h2 class="mt-0.5 text-lg font-bold">เมนูของฉัน</h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-sm"
            aria-label="ปิดเมนูด้านข้าง"
            @click="isDrawerOpen = false"
          >
            <Icon name="lucide:x" size="19" />
          </button>
        </div>

        <div class="flex flex-1 flex-col gap-6 p-5">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-primary/12"
            :class="
              route.path === '/profile'
                ? 'bg-neutral text-neutral-content!'
                : 'bg-primary/8'
            "
            @click="isDrawerOpen = false"
          >
            <div
              class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-primary"
            >
              <img
                v-if="lineProfileImageUrl && !hasLineProfileImageError"
                :src="lineProfileImageUrl"
                alt="รูปโปรไฟล์ LINE"
                class="size-full object-cover"
                @error="hasLineProfileImageError = true"
              />
              <Icon v-else name="lucide:user-round" size="21" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">
                {{ user?.firstname }} {{ user?.lastname }}
              </p>
              <p class="truncate text-xs">
                {{ user?.email }}
              </p>
            </div>
            <Icon
              name="lucide:chevron-right"
              size="18"
              :class="
                route.path === '/profile'
                  ? 'text-neutral-content'
                  : 'text-base-content/40'
              "
            />
          </NuxtLink>

          <div class="md:hidden block">
            <p class="mb-2 px-3 text-xs font-semibold text-base-content/45">
              เมนูหลัก
            </p>
            <ul class="menu w-full gap-1 p-0">
              <li v-for="menu in menus" :key="`drawer-${menu.path}`">
                <NuxtLink
                  :to="menu.path"
                  :class="route.path === menu.path ? 'menu-active' : ''"
                  @click="isDrawerOpen = false"
                >
                  <Icon :name="menu.icon" size="19" />
                  {{ menu.title }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <p class="mb-2 px-3 text-xs font-semibold text-base-content/45">
              บัญชีและคำสั่งซื้อ
            </p>
            <ul class="menu w-full gap-1 p-0">
              <li>
                <NuxtLink
                  to="/shopping-basket"
                  :class="
                    route.path === '/shopping-basket' ? 'menu-active' : ''
                  "
                  @click="isDrawerOpen = false"
                >
                  <Icon
                    name="material-symbols:shopping-cart-outline-rounded"
                    size="19"
                  />
                  <span class="flex-1">ตะกร้าสินค้า</span>
                  <span
                    class="badge badge-sm rounded-full"
                    :class="
                      route.path === '/shopping-basket'
                        ? 'badge-accent'
                        : 'badge-secondary'
                    "
                  >
                    {{ itemCount }}
                  </span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/orders"
                  :class="route.path === '/orders' ? 'menu-active' : ''"
                  @click="isDrawerOpen = false"
                >
                  <Icon
                    name="material-symbols:local-shipping-outline-rounded"
                    size="19"
                  />
                  เช็คสถานะการจัดซื้อ/จัดส่ง
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/contact"
                  :class="route.path === '/contact' ? 'menu-active' : ''"
                  @click="isDrawerOpen = false"
                >
                  <Icon
                    name="material-symbols:chat-outline-rounded"
                    size="19"
                  />
                  ติดต่อเรา
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="mt-auto border-t border-base-300 pt-4">
            <button
              type="button"
              class="btn btn-ghost w-full justify-start text-error"
              @click="onSignOut"
            >
              <Icon name="lucide:log-out" size="18" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>
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
const isDrawerOpen = ref(false);
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
  {
    path: "/",
    title: "หน้าแรก",
    icon: "material-symbols:home-outline-rounded",
  },
  {
    path: "/products",
    title: "สินค้าทั้งหมด",
    icon: "material-symbols:storefront-outline-rounded",
  },
  {
    path: "/how-to-order",
    title: "วิธีการสั่งซื้อ",
    icon: "material-symbols:help-outline-rounded",
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
  isDrawerOpen.value = false;
  await $fetch("/api/auth/logout", { method: "POST" });
  lineAccounts.value = [];
  clearCurrentUser();
  await navigateTo("/");
};
</script>
