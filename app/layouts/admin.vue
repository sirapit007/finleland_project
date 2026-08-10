<template>
  <div class="flex h-dvh min-h-0 overflow-hidden bg-base-200 text-base-content">
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 sm:hidden"
      v-on:click="isSidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex h-dvh w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 transition-transform duration-300 sm:static sm:z-auto sm:w-60 sm:translate-x-0 shadow-sm"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div
        class="h-16 border-b border-base-300 px-4 flex items-center justify-between"
      >
        <NuxtLink to="/admin/products" class="flex items-center gap-3 min-w-0">
          <div
            class="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-100"
          >
            <img
              src="/icon-192.png"
              alt="Finleland"
              class="h-full w-full object-cover"
            />
          </div>

          <div class="min-w-0">
            <div class="font-bold truncate">Finleland</div>
            <div class="text-xs text-base-content/50">Admin Dashboard</div>
          </div>
        </NuxtLink>

        <button
          class="btn btn-ghost btn-square btn-sm sm:hidden"
          @click="isSidebarOpen = false"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <!-- Menu -->
      <div
        class="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:overflow-hidden"
      >
        <div class="mb-2">
          <NuxtLink
            :key="'/admin'"
            :to="'/admin'"
            @click="isSidebarOpen = false"
            class="group relative mb-2 flex h-8 items-center gap-3 rounded-xl px-3 transition-all duration-200"
            :class="
              route.path === '/admin'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-base-200'
            "
          >
            <Icon :name="'lucide:home'" size="18" class="shrink-0" />

            <span class="truncate text-xs">
              {{ "แดชบอร์ด" }}
            </span>
          </NuxtLink>
        </div>
        <div class="mb-2">
          <NuxtLink
            :key="'/admin/orders'"
            :to="'/admin/orders'"
            @click="isSidebarOpen = false"
            class="group relative mb-2 flex h-8 items-center gap-3 rounded-xl px-3 transition-all duration-200"
            :class="
              route.path === '/admin/orders'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-base-200'
            "
          >
            <Icon :name="'lucide:clipboard-clock'" size="18" class="shrink-0" />

            <span class="truncate text-xs">
              {{ "คำสั่งซื้อ" }}
            </span>
          </NuxtLink>
        </div>

        <div v-for="group in menuGroups" :key="group.title" class="mb-2">
          <div
            class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/40"
          >
            {{ group.title }}
          </div>

          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            @click="isSidebarOpen = false"
            class="group relative mb-2 flex h-8 items-center gap-3 rounded-xl px-3 transition-all duration-200"
            :class="
              route.path === item.to
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-base-200'
            "
          >
            <Icon :name="item.icon" size="18" class="shrink-0" />

            <span class="truncate text-xs">
              {{ item.label }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- User -->
      <div class="w-full shrink-0 border-t border-base-300 p-3">
        <div class="flex items-center gap-3 rounded-xl bg-base-200 p-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content font-semibold shrink-0"
          >
            {{ adminInitials }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="font-medium truncate text-sm">{{ adminName }}</div>
            <div class="text-xs text-base-content/50">{{ adminRole }}</div>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0 text-error sm:block hidden"
            aria-label="Sign out"
            title="Sign out"
            @click="onSignOut"
          >
            <Icon name="lucide:log-out" size="16" />
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-base-300 bg-base-100/90 px-4 backdrop-blur sm:hidden"
      >
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm"
            aria-label="Open sidebar"
            v-on:click="isSidebarOpen = true"
          >
            <Icon name="lucide:menu" size="20" />
          </button>

          <div>
            <div class="font-semibold leading-none">Admin Panel</div>

            <div class="text-xs text-base-content/50">
              Finleland Management System
            </div>
          </div>
        </div>

        <button
          class="btn btn-error btn-outline sm:btn-sm btn-xs"
          @click="onSignOut"
        >
          <Icon name="lucide:log-out" size="16" />
          Sign out
        </button>
      </header>

      <main class="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const isSidebarOpen = ref(false);
const { syncFromStorage, user } = useCurrentUser();

const adminName = computed(() => {
  const name = [user.value?.firstname, user.value?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.value?.email || "ผู้ดูแลระบบ";
});
const adminRole = computed(() => user.value?.role || "ผู้ดูแลระบบ");
const adminInitials = computed(() => adminName.value.slice(0, 1).toUpperCase());

onMounted(() => {
  syncFromStorage();
});

const menuGroups = computed(() => [
  {
    title: "ดูแลระบบ",
    items: navAdminItems,
  },
  {
    title: "จัดการ",
    items: navManageItems,
  },
  {
    title: "อีเว้นท์",
    items: navEventItems,
  },
  {
    title: "กู้คืน",
    items: navDeleteItems,
  },
]);

const navAdminItems = [
  {
    to: "/admin/users",
    label: "ดูแลผู้ใช้งานระบบ",
    icon: "lucide:users-round",
  },
  {
    to: "/admin/contacts",
    label: "ความคิดเห็นผู้ใช้งาน",
    icon: "lucide:message-square-text",
  },
];

const navManageItems = [
  {
    to: "/admin/products",
    label: "จัดการรายการสินค้า",
    icon: "lucide:package",
  },
  {
    to: "/admin/categories",
    label: "จัดการรายการหมวดหมู่",
    icon: "lucide:tags",
  },
  {
    to: "/admin/suppliers",
    label: "จัดการรายการผู้จัดจำหน่าย",
    icon: "lucide:truck",
  },
  {
    to: "/admin/promotion/types",
    label: "จัดการประเภทโปรโมชั่น",
    icon: "lucide:badge-percent",
  },
];

const navEventItems = [
  {
    to: "/admin/promotion",
    label: "โปรโมชั่นสินค้า",
    icon: "lucide:gift",
  },
];

const navDeleteItems = [
  {
    to: "/admin/products/deleted",
    label: "กู้คืนรายการสินค้า",
    icon: "lucide:package-search",
  },
  {
    to: "/admin/categories/deleted",
    label: "กู้คืนรายการหมวดหมู่",
    icon: "lucide:tags",
  },
  {
    to: "/admin/suppliers/deleted",
    label: "กู้คืนรายการผู้จัดจำหน่าย",
    icon: "lucide:truck",
  },
];
const route = useRoute();

const onSignOut = async () => {
  await $fetch("/api/auth/logout", {
    method: "POST",
  });

  if (import.meta.client) {
    localStorage.removeItem("web-user");
  }

  await navigateTo("/admin/login");
};
</script>
