<template>
  <div class="flex min-h-dvh bg-base-200 text-base-content">
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      v-on:click="isSidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-base-300 bg-base-100 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0"
      v-bind:class="[
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
      ]"
    >
      <div
        class="flex h-14 items-center border-b border-base-300 px-3"
        v-bind:class="
          isSidebarCollapsed
            ? 'justify-between lg:justify-center'
            : 'justify-between'
        "
      >
        <NuxtLink
          to="/admin/products"
          class="min-w-0 text-lg font-bold"
          v-bind:title="isSidebarCollapsed ? 'Finleland Admin' : undefined"
          v-on:click="isSidebarOpen = false"
        >
          <span v-if="!isSidebarCollapsed">Finleland Admin</span>
          <template v-else>
            <span class="lg:hidden">Finleland Admin</span>
            <span class="hidden lg:inline">FA</span>
          </template>
        </NuxtLink>

        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm lg:hidden"
          aria-label="Close sidebar"
          v-on:click="isSidebarOpen = false"
        >
          <Icon name="lucide:x" size="18" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="item in navItems"
          v-bind:key="item.to"
          v-bind:to="item.to"
          class="btn btn-ghost btn-sm w-full gap-3"
          v-bind:class="
            isSidebarCollapsed
              ? 'justify-start lg:justify-center lg:px-0'
              : 'justify-start'
          "
          v-bind:title="isSidebarCollapsed ? item.label : undefined"
          v-on:click="isSidebarOpen = false"
        >
          <Icon v-bind:name="item.icon" size="18" class="shrink-0" />
          <span
            class="truncate"
            v-bind:class="isSidebarCollapsed ? 'lg:hidden' : ''"
          >
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>

      <div class="hidden border-t border-base-300 p-3 lg:block">
        <button
          type="button"
          class="btn btn-ghost btn-sm w-full gap-3"
          v-bind:class="
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'
          "
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
            size="18"
          />
          <span v-if="!isSidebarCollapsed">Collapse</span>
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-14 items-center justify-between border-b border-base-300 bg-base-100 px-3 sm:px-4"
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

          <div class="truncate font-semibold">Admin Panel</div>
        </div>

        <button class="btn btn-ghost btn-sm" v-on:click="onSignOut">
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

const navItems = [
  {
    to: "/admin/products",
    label: "จัดการสินค้าทั้งหมด",
    icon: "lucide:package",
  },
  {
    to: "/admin/products/deleted",
    label: "กู้คืนสินค้าที่เคยถูกลบ",
    icon: "lucide:package",
  },
  {
    to: "/admin/category",
    label: "ตั้งค่าหมวดหมู่ของสินค้า",
    icon: "lucide:tags",
  },
];

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
