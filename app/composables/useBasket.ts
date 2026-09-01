type BasketItem = {
  uuid: string;
  basket_product: string;
  basket_quantity: number | string;
  basket_total: number | string;
  basket_expire: string;
  image_url?: string | string[] | null;
  product_code?: string | null;
  product_name?: string | null;
  product_selling_price?: number | string | null;
  product_shipping_weight_grams?: number | string | null;
  product_shipping_length_cm?: number | string | null;
  product_shipping_width_cm?: number | string | null;
  product_shipping_height_cm?: number | string | null;
  promotion_uuid?: string | null;
  promotion_name?: string | null;
  promotion_discounted_price?: number | string | null;
  promotion_bundle_price?: number | string | null;
  promotion_min_quantity?: number | string | null;
  promotion_min_purchase_amount?: number | string | null;
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
  const updatingItemUuids = useState<string[]>(
    "basket-updating-items",
    () => [],
  );

  // Hide an expired item locally without requiring a polling request.
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

  async function addToBasket(
    product: Record<string, unknown>,
    quantity: number,
  ) {
    const user = getStoredUser();
    const productUuid = String(product.uuid || "").trim();
    const price = Number(product.product_selling_price || 0);
    const basketQuantity = Math.max(Math.floor(Number(quantity)), 0);

    if (!user?.uuid) {
      throw new Error("Please sign in before adding products to the basket.");
    }

    if (
      !productUuid ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !basketQuantity
    ) {
      throw new Error("The product or quantity is invalid.");
    }

    // Always read the newest basket before deciding whether to create or merge an item.
    await refreshBasket();
    const existingItem = activeItems.value.find(
      (item) => item.basket_product === productUuid,
    );

    if (existingItem) {
      await $fetch(`/api/basket/${existingItem.uuid}`, {
        method: "PUT",
        body: {
          basket_product: productUuid,
          basket_quantity:
            Number(existingItem.basket_quantity) + basketQuantity,
          basket_total:
            Number(existingItem.product_selling_price || price) *
            (Number(existingItem.basket_quantity) + basketQuantity),
          user,
        },
      });
    } else {
      await $fetch("/api/basket", {
        method: "POST",
        body: {
          basket_product: productUuid,
          basket_quantity: basketQuantity,
          basket_total: price * basketQuantity,
          user,
        },
      });
    }

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

  function isItemUpdating(uuid: string) {
    return updatingItemUuids.value.includes(uuid);
  }

  async function removeBasketItem(item: BasketItem) {
    const user = getStoredUser();

    if (!user?.uuid) {
      throw new Error("Please sign in before updating the basket.");
    }

    if (isItemUpdating(item.uuid)) {
      return;
    }

    updatingItemUuids.value = [...updatingItemUuids.value, item.uuid];

    try {
      await $fetch(`/api/basket/${item.uuid}`, {
        method: "DELETE",
        body: { user },
      });
      await refreshBasket();
    } finally {
      updatingItemUuids.value = updatingItemUuids.value.filter(
        (uuid) => uuid !== item.uuid,
      );
    }
  }

  async function updateBasketQuantity(item: BasketItem, nextQuantity: number) {
    const user = getStoredUser();
    const currentQuantity = Number(item.basket_quantity || 0);
    const unitPrice = Number(item.product_selling_price || 0);
    const quantity = Math.max(Math.floor(nextQuantity), 0);

    if (!user?.uuid) {
      throw new Error("Please sign in before updating the basket.");
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error("The basket item price is invalid.");
    }

    if (!quantity) {
      await removeBasketItem(item);
      return;
    }

    if (isItemUpdating(item.uuid)) {
      return;
    }

    updatingItemUuids.value = [...updatingItemUuids.value, item.uuid];

    try {
      await $fetch(`/api/basket/${item.uuid}`, {
        method: "PUT",
        body: {
          basket_product: item.basket_product,
          basket_quantity: quantity,
          basket_total: unitPrice * quantity,
          user,
        },
      });
      await refreshBasket();
    } finally {
      updatingItemUuids.value = updatingItemUuids.value.filter(
        (uuid) => uuid !== item.uuid,
      );
    }
  }

  return {
    activeItems,
    addToBasket,
    clearBasket,
    isLoading,
    isItemUpdating,
    itemCount,
    removeBasketItem,
    refreshBasket,
    updateBasketQuantity,
  };
}
