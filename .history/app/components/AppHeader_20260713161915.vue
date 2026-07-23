<template>
  <dialog ref="signInModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-xsm btn-circle absolute right-4 top-4">✕</button>
      </form>

      <ModalSignIn :key="signInKey" @update:leaving="onSignUp" />
    </div>
  </dialog>

  <dialog ref="signUpModal" class="modal">
    <div class="modal-box max-w-md">
      <form method="dialog">
        <button class="btn btn-xsm btn-circle absolute right-4 top-4">✕</button>
      </form>

      <ModalSignUp :key="signUpKey" @update:leaving="onSignIn" />
    </div>
  </dialog>

  <header>
    <div class="bg-primary h-8 flex justify-center">
      <div class="navbar-start w-[80%] flex justify-between">
        <div class="w-full space-x-5 text-xs">
          <template v-if="isLoggedIn">
            <NuxtLink
              to="/products"
              class="text-xs text-primary-content hover:underline"
              >เช็คสถานะการจัดซื้อ/จัดส่ง</NuxtLink
            >
          </template>
          <template v-else>
            <button
              class="btn btn-xs btn-link text-primary-content no-underline relative z-10"
              @click="onSignUp"
            >
              สมัครสมาชิก
            </button>
            <button
              class="btn btn-xs btn-link text-primary-content no-underline relative z-10"
              @click="onSignIn"
            >
              เข้าสู่ระบบ
            </button>
          </template>
        </div>
        <div
          class="w-full text-sm text-end text-primary-content font-semibold"
          v-if="isLoggedIn"
        >
          <span class="space-x-1 flex-inline">
            <Icon name="lucide:user-round" />
            <span>{{ user.firstname }} {{ user.lastname }}</span>
          </span>
          <button class="text-error" @click="onSignOut">
            <Icon name="lucide:log-out" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>

    {{ user }}

    <div
      class="navbar border-b border-base-300 bg-base-100 h-20 flex justify-center"
    >
      <div class="navbar-start w-[78%] flex justify-between">
        <NuxtLink to="/">
          <img src="@/assets/images/logo.png" alt="..." class="max-h-30" />
        </NuxtLink>
        <div class="space-x-5 flex">
          <template v-for="menu in menus">
            <NuxtLink
              :to="menu.path"
              class="text-sm hover:text-primary"
              :class="
                route.path === menu.path ? 'text-primary font-semibold' : ''
              "
              >{{ menu.title }}</NuxtLink
            >
          </template>
          <NuxtLink
            v-if="user"
            :to="'/shopping-basket'"
            class="text-sm hover:text-primary flex items-center gap-1"
            :class="
              route.path === '/shopping-basket'
                ? 'text-primary font-semibold'
                : ''
            "
            ><Icon name="lucide:shopping-cart" size="16" /> ตะกร้าสินค้า
            <span
              class="badge badge-sm rounded-full text-xs"
              :class="
                route.path === '/shopping-basket'
                  ? 'badge-primary'
                  : 'badge-secondary'
              "
              >{{ itemCount }}</span
            >
          </NuxtLink>
          <NuxtLink
            v-if="user"
            to="/profile"
            class="text-sm hover:text-primary flex items-center gap-1"
            :class="
              route.path === '/profile' ? 'text-primary font-semibold' : ''
            "
          >
            <Icon name="lucide:user-round" size="16" /> โปรไฟล์
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const signInModal = ref<HTMLDialogElement | null>(null);
const signUpModal = ref<HTMLDialogElement | null>(null);
const signInKey = ref(0);
const signUpKey = ref(0);
const { itemCount, refreshBasket } = useBasket();
const { clearCurrentUser, syncFromStorage, user } = useCurrentUser();
let basketRefreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  syncFromStorage();

  void refreshBasket().catch((error) => {
    console.error("Unable to refresh basket", error);
  });
  basketRefreshTimer = setInterval(() => {
    void refreshBasket().catch((error) => {
      console.error("Unable to refresh basket", error);
    });
  }, 30_000);
});

onBeforeUnmount(() => {
  if (basketRefreshTimer) {
    clearInterval(basketRefreshTimer);
  }
});

const isLoggedIn = computed(() => {
  return !!user.value;
});

const menus = ref([
  {
    path: "/",
    title: "หน้าแรก",
  },
  {
    path: "/products",
    title: "สินค้าทั้งหมด",
  },
  {
    path: "/how-to-order",
    title: "วิธีการสั่งซื้อ",
  },
]);
const route = useRoute();

const onSignIn = async () => {
  signUpModal.value?.close();
  signInKey.value += 1;
  signInModal.value?.showModal();
};

const onSignUp = async () => {
  signInModal.value?.close();
  signUpKey.value += 1;
  signUpModal.value?.showModal();
};

const onSignOut = async () => {
  await $fetch("/api/auth/logout", {
    method: "POST",
  });

  clearCurrentUser();

  await window.location.reload();
};
</script>
