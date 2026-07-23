<template>
  <div class="flex min-h-dvh bg-base-200 text-base-content">
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      v-on:click="isSidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 shrink-0 flex flex-col border-r border-base-300 bg-base-100 transition-all duration-300 lg:static lg:z-auto"
      :class="[
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        isSidebarCollapsed ? 'lg:w-20 w-64' : 'w-60',
      ]"
    >
      <!-- Logo -->
      <div
        class="h-16 border-b border-base-300 px-4 flex items-center justify-between"
      >
        <NuxtLink to="/admin/products" class="flex items-center gap-3 min-w-0">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shrink-0"
          >
            <Icon name="lucide:box" size="18" />
          </div>

          <div
            class="min-w-0"
            :class="isSidebarCollapsed ? 'hidden lg:hidden' : ''"
          >
            <div class="font-bold truncate">Finleland</div>
            <div class="text-xs text-base-content/50">Admin Dashboard</div>
          </div>
        </NuxtLink>

        <button
          class="btn btn-ghost btn-square btn-sm lg:hidden"
          @click="isSidebarOpen = false"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <!-- Menu -->
      <div class="flex-1 h-full overflow-y-auto mt-2 px-3 pb-3">
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
            :title="isSidebarCollapsed ? 'แดชบอร์ด' : undefined"
          >
            <Icon :name="'lucide:home'" size="18" class="shrink-0" />

            <span
              class="truncate text-xs"
              :class="isSidebarCollapsed ? 'hidden lg:hidden' : ''"
            >
              {{ "แดชบอร์ด" }}
            </span>
          </NuxtLink>
        </div>

        <div v-for="group in menuGroups" :key="group.title" class="mb-2">
          <div
            v-if="!isSidebarCollapsed"
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
            :title="isSidebarCollapsed ? item.label : undefined"
          >
            <Icon :name="item.icon" size="18" class="shrink-0" />

            <span
              class="truncate text-xs"
              :class="isSidebarCollapsed ? 'hidden lg:hidden' : ''"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- User -->
      <div class="border-t border-base-300 p-3 absolute bottom-0 w-full">
        <div
          class="flex items-center gap-3 rounded-xl bg-base-200 p-2"
          :class="isSidebarCollapsed ? 'justify-center' : ''"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content font-semibold shrink-0"
          >
            A
          </div>

          <div v-if="!isSidebarCollapsed" class="min-w-0">
            <div class="font-medium truncate">admin</div>

            <div class="text-xs text-base-content/50">Administrator</div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-base-300 bg-base-100/90 backdrop-blur px-4"
      >
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm lg:hidden"
            aria-label="Open sidebar"
            v-on:click="isSidebarOpen = true"
          >
            <Icon name="lucide:menu" size="20" />
          </button>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm hidden lg:inline-flex"
            v-bind:aria-label="
              isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            "
            v-bind:title="
              isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            "
            v-on:click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <Icon
              v-bind:name="
                isSidebarCollapsed
                  ? 'lucide:panel-left-open'
                  : 'lucide:panel-left-close'
              "
              size="20"
            />
          </button>

          |

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

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

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
