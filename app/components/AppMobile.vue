<template>
  <footer
    class="block h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden"
  >
    <nav
      class="dock dock-md z-40 border-base-300 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] gap-1 bg-primary!"
      aria-label="เมนูนำทางบนมือถือ"
    >
      <NuxtLink
        to="/"
        class="text-primary-content transition-colors duration-200"
        :class="
          isMenuActive('/')
            ? 'text-primary! font-bold bg-primary-content/60'
            : ''
        "
        aria-label="หน้าแรก"
        :aria-current="isMenuActive('/') ? 'page' : undefined"
      >
        <div>
          <Icon
            :name="
              isMenuActive('/')
                ? 'material-symbols:home-rounded'
                : 'material-symbols:home-outline-rounded'
            "
            :class="isMenuActive('/') ? 'transition scale-120!' : ''"
            size="20"
          />
        </div>
        <span class="dock-label">หน้าแรก</span>
      </NuxtLink>

      <NuxtLink
        to="/products"
        class="text-primary-content transition-colors duration-200"
        :class="
          isMenuActive('/products')
            ? 'text-primary! font-bold bg-primary-content/60'
            : ''
        "
        aria-label="สินค้าทั้งหมด"
        :aria-current="isMenuActive('/products') ? 'page' : undefined"
      >
        <div>
          <Icon
            :name="
              isMenuActive('/products')
                ? 'material-symbols:storefront-rounded'
                : 'material-symbols:storefront-outline-rounded'
            "
            :class="isMenuActive('/products') ? 'transition scale-120!' : ''"
            size="20"
          />
        </div>
        <span class="dock-label">สินค้า</span>
      </NuxtLink>

      <NuxtLink
        to="/how-to-order"
        class="text-primary-content transition-colors duration-200"
        :class="
          isMenuActive('/how-to-order')
            ? 'text-primary! font-bold bg-primary-content/60'
            : ''
        "
        aria-label="วิธีการสั่งซื้อ"
        :aria-current="isMenuActive('/how-to-order') ? 'page' : undefined"
      >
        <div>
          <Icon
            :name="
              isMenuActive('/how-to-order')
                ? 'material-symbols:help-rounded'
                : 'material-symbols:help-outline-rounded'
            "
            :class="
              isMenuActive('/how-to-order') ? 'transition scale-120!' : ''
            "
            size="20"
          />
        </div>
        <span class="dock-label">วิธีการสั่งซื้อ</span>
      </NuxtLink>

      <template v-if="isLoggedIn">
        <NuxtLink
          to="/shopping-basket"
          class="text-primary-content transition-colors duration-200"
          :class="
            isMenuActive('/shopping-basket')
              ? 'text-primary! font-bold bg-primary-content/60'
              : ''
          "
          aria-label="ตะกร้าสินค้า"
          :aria-current="isMenuActive('/shopping-basket') ? 'page' : undefined"
        >
          <div class="relative">
            <Icon
              :name="
                isMenuActive('/shopping-basket')
                  ? 'material-symbols:shopping-cart-rounded'
                  : 'material-symbols:shopping-cart-outline-rounded'
              "
              :class="
                isMenuActive('/shopping-basket') ? 'transition scale-120!' : ''
              "
              size="20"
            />
            <span
              v-if="itemCount > 0"
              class="badge badge-secondary badge-xs absolute -right-3 -top-1 min-w-4 rounded-full px-1 text-[9px] font-semibold"
            >
              {{ basketCountLabel }}
            </span>
          </div>
          <span class="dock-label">ตะกร้า</span>
        </NuxtLink>

        <NuxtLink
          to="/orders"
          class="text-primary-content transition-colors duration-200"
          :class="
            isMenuActive('/orders')
              ? 'text-primary! font-bold bg-primary-content/60'
              : ''
          "
          aria-label="เช็คสถานะการจัดซื้อ/จัดส่ง"
          :aria-current="isMenuActive('/orders') ? 'page' : undefined"
        >
          <div>
            <Icon
              :name="
                isMenuActive('/orders')
                  ? 'material-symbols:local-shipping-rounded'
                  : 'material-symbols:local-shipping-outline-rounded'
              "
              :class="isMenuActive('/orders') ? 'transition scale-120!' : ''"
              size="20"
            />
          </div>
          <span class="dock-label">สถานะ</span>
        </NuxtLink>

        <NuxtLink
          to="/contact"
          class="text-primary-content transition-colors duration-200"
          :class="
            isMenuActive('/contact')
              ? 'text-primary! font-bold bg-primary-content/60'
              : ''
          "
          aria-label="ติดต่อเรา"
          :aria-current="isMenuActive('/contact') ? 'page' : undefined"
        >
          <div>
            <Icon
              :name="
                isMenuActive('/contact')
                  ? 'material-symbols:chat-rounded'
                  : 'material-symbols:chat-outline-rounded'
              "
              :class="isMenuActive('/contact') ? 'transition scale-120!' : ''"
              size="20"
            />
          </div>
          <span class="dock-label">ติดต่อ</span>
        </NuxtLink>
      </template>
    </nav>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute();
const { itemCount } = useBasket();
const { user } = useCurrentUser();
const isLoggedIn = computed(() => Boolean(user.value));
const basketCountLabel = computed(() =>
  itemCount.value > 99 ? "99+" : String(itemCount.value),
);

function isMenuActive(path: string) {
  if (path === "/") return route.path === path;
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>
