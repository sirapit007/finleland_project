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
        <!-- <label class="swap swap-rotate">
            <input
              type="checkbox"
              class="theme-controller"
              value="synthwave"
              @click="$emit('toggle-theme')"
            />
            <svg
              class="swap-off h-6 w-6 fill-current text-primary-content"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
              />
            </svg>
            <svg
              class="swap-on h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
              />
            </svg>
          </label> -->
        <div
          class="w-full text-sm text-end text-primary-content font-semibold"
          v-if="isLoggedIn"
        >
          <div class="dropdown dropdown-end relative z-10">
            <div tabindex="0" role="button" class="btn btn-link">
              <Icon
                name="lucide:circle-user-round"
                class="text-primary-content"
              />
              <span class="text-primary-content"
                >{{ user.firstname }} {{ user.lastname }}</span
              >
              <Icon name="lucide:chevron-down" class="text-primary-content" />
            </div>
            <ul
              tabindex="-1"
              class="dropdown-content menu bg-base-100 rounded-box z-1 w-50 p-4 shadow-lg text-base-content text-xs gap-2"
            >
              <li>
                <NuxtLink class="text-xs hover:text-primary">
                  <Icon name="lucide:map-pin" size="16" />
                  ที่อยู่ในการจัดส่ง
                </NuxtLink>
              </li>
              <li>
                <button class="text-error" @click="onSignOut">
                  <Icon name="lucide:log-out" size="16" />
                  ออกจากระบบ
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div
      class="navbar border-b border-base-300 bg-base-100 h-20 flex justify-center"
    >
      <div class="navbar-start w-[80%] flex justify-between">
        <NuxtLink to="/">
          <img src="@/assets/images/logo.png" alt="..." class="max-h-30" />
        </NuxtLink>
        <div class="space-x-5">
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
const user = ref<any>(null);

onMounted(() => {
  const stored = localStorage.getItem("web-user");
  user.value = stored ? JSON.parse(stored) : null;
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

  if (import.meta.client) {
    localStorage.removeItem("web-user");
  }

  await window.location.reload();
};
</script>
