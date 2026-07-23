type BasketItem = {
  uuid: string;
  basket_product: string;
  basket_quantity: number | string;
  basket_total: number | string;
  basket_expire: string;
};

type BasketResponse = {
  rows: BasketItem[];
  totalQuantity?: number | string;
};

type BasketUser = {
  uuid?: string;
  [key: string]: unknown;
};

function getStoredUser(): BasketUser | null {
  if (!import.meta.client) {
    return null;
  }

  const stored = localStorage.getItem("web-user");

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as BasketUser;
  } catch {
    return null;
  }
}

export function useBasket() {
  const items = useState<BasketItem[]>("basket-items", () => []);
  const itemCount = useState<number>("basket-item-count", () => 0);
  const isLoading = useState<boolean>("basket-loading", () => false);

  // This mirrors the API condition so an item is hidden even if it expires between polls.
  const activeItems = computed(() =>
    items.value.filter((item) => {
      const expiry = new Date(item.basket_expire).getTime();
      return Number.isFinite(expiry) && expiry > Date.now();
    }),
  );

  async function refreshBasket() {
    const user = getStoredUser();

    if (!user?.uuid) {
      items.value = [];
      itemCount.value = 0;
      return;
    }

    isLoading.value = true;

    try {
      const response = await $fetch<BasketResponse>("/api/basket", {
        params: {
          pageSize: 100,
          created_by: user.uuid,
        },
      });

      items.value = response.rows ?? [];
      itemCount.value = Number(
        response.totalQuantity ??
          items.value.reduce(
            (total, item) => total + Number(item.basket_quantity || 0),
            0,
          ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  async function addToBasket(product: Record<string, unknown>, quantity: number) {
    const user = getStoredUser();
    const productName = String(product.product_name || "").trim();
    const price = Number(product.product_selling_price || 0);
    const basketQuantity = Math.max(Math.floor(Number(quantity)), 0);

    if (!user?.uuid) {
      throw new Error("Please sign in before adding products to the basket.");
    }

    if (!productName || !Number.isFinite(price) || price <= 0 || !basketQuantity) {
      throw new Error("The product or quantity is invalid.");
    }

    await $fetch("/api/basket", {
      method: "POST",
      body: {
        basket_product: productName,
        basket_quantity: basketQuantity,
        basket_total: price * basketQuantity,
        user,
      },
    });

    await refreshBasket();
  }

  async function clearBasket() {
    const user = getStoredUser();

    if (!user?.uuid || !activeItems.value.length) {
      return;
    }

    await Promise.all(
      activeItems.value.map((item) =>
        $fetch(`/api/basket/${item.uuid}`, {
          method: "DELETE",
          body: { user },
        }),
      ),
    );

    await refreshBasket();
  }

  return {
    activeItems,
    addToBasket,
    clearBasket,
    isLoading,
    itemCount,
    refreshBasket,
  };
}
