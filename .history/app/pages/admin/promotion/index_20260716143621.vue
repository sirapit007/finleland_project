<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-2xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Promotion</h3>

      <div class="mt-2 grid sm:grid-cols-2 grid-cols-1 gap-4">
        <!-- {{ base.form.promotion_type }} -->
        <div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Product</legend>
            <ComboBox
              v-model="base.form.promotion_product"
              fetchUrl="/api/products"
              placeholder="เลือกสินค้า..."
              label="product_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Type</legend>
            <ComboBox
              v-model="base.form.promotion_type"
              fetchUrl="/api/promotion/types"
              placeholder="เลือกประเภทโปรโมชั่น..."
              label="promotion_type_name"
              value="uuid"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Name</legend>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="สูงสุด 100 ตัวอักษร..."
              v-model="base.form.promotion_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Promotion Description</legend>
            <textarea
              class="textarea textarea-sm w-full"
              placeholder="กี่ตัวตัวอักษรก็ได้..."
              v-model="base.form.promotion_description"
            ></textarea>
          </fieldset>
          <div class="grid grid-cols-2 gap-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion Start Date</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="base.form.promotion_start_date"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion End Date</legend>
              <input
                type="date"
                class="input input-sm w-full"
                placeholder="..."
                v-model="base.form.promotion_end_date"
              />
            </fieldset>
          </div>
        </div>
        <div>
          <div
            v-if="
              base.form.promotion_type !==
              '70977b66-e3d8-45f2-bdfb-b9776f959027'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Promotion Discounted Price
              </legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_discounted_price"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              '3d13b772-9442-48d8-90a0-f35d825d390a'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion Min Quantity</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_min_quantity"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              'be08aae7-30ef-46d1-a415-e581cd71a903'
            "
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Promotion Min Purchase Amount
              </legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_min_purchase_amount"
              />
            </fieldset>
          </div>
          <div
            v-if="
              base.form.promotion_type ===
              '70977b66-e3d8-45f2-bdfb-b9776f959027'
            "
            class="space-y-2"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Promotion Bundle Price</legend>
              <input
                type="number"
                min="1"
                class="input input-sm w-full"
                placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                v-model="base.form.promotion_bundle_price"
              />
            </fieldset>
            <div
              v-for="(v, i) in detail.rows"
              class="border border-base-content/20 rounded-lg p-2 relative"
            >
              <button
                v-if="(i as number) > 1"
                class="btn btn-xs btn-square btn-ghost btn-error absolute right-1 top-1"
                v-on:click="fnDetail.onRemoveRow(i as number)"
              >
                ✕
              </button>
              <div
                class="w-4 h-4 bg-warning rounded-full text-[10px] font-semibold flex justify-center items-center absolute left-1 top-1"
              >
                {{ (i as number) + 1 }}
              </div>
              <fieldset class="fieldset mt-3">
                <legend class="fieldset-legend">Bundle Product</legend>
                <ComboBox
                  v-model="detail.rows[i].bundle_item_product"
                  fetchUrl="/api/products"
                  placeholder="เลือกสินค้า..."
                  label="product_name"
                  value="uuid"
                  :disabled="!i"
                />
              </fieldset>
              <div class="grid grid-cols-2 gap-2">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Bundle Quantity</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="detail.rows[i].bundle_item_quantity"
                  />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Bundle Unit Price</legend>
                  <input
                    type="number"
                    min="1"
                    class="input input-xs w-full"
                    placeholder="ตัวเลข มากกว่า 1 เท่านั้น..."
                    v-model="detail.rows[i].bundle_item_unit_price"
                  />
                </fieldset>
              </div>
            </div>

            <button
              class="w-full btn btn-xs btn-soft btn-secondary"
              type="button"
              v-on:click="fnDetail.onAddRow()"
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="flex-1 btn sm:btn-sm btn-xs" @click="baseModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-secondary"
          type="button"
          @click="fnBase.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="removeModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันการลบรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-warning"
          class="text-error"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button
          class="flex-1 btn sm:btn-sm btn-xs"
          @click="removeModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-error"
          type="button"
          @click="fnRemove.onSubmit()"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="imageModal" class="modal">
    <div class="modal-box max-w-lg">
      <form method="dialog">
        <button
          class="btn btn-sm btn-circle btn-neutral absolute right-2 top-2"
        >
          ✕
        </button>
      </form>

      <div class="h-100">
        <img :src="imageSrc" class="h-full w-full object-contain" />
      </div>
    </div>
  </dialog>

  <div class="p-4 bg-base-100">
    <div class="flex md:flex-row flex-col justify-between">
      <div class="space-x-3">
        <span class="font-bold text-xl text-primary">Event Promotion</span
        ><span class="font-semibold text-base text-secondary"
          >โปรโมชั่นสินค้า</span
        >
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-64">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อโปรโมชั่น หรือคำค้นหาอื่นๆ..."
            v-model="q"
          />
        </label>
        <button
          class="btn sm:btn-sm btn-xs btn-primary shadow-sm"
          v-on:click="fnBase.onCreate()"
        >
          <Icon name="lucide:plus" size="16" />
          เพิ่มโปรโมชั่น
        </button>
      </div>
    </div>
    <div
      class="min-h-[calc(100dvh-12.5rem)] max-h-[calc(100dvh-12.5rem)] overflow-auto my-4 relative"
      :class="pending ? 'backdrop-blur-sm' : ''"
    >
      <p
        v-if="pending"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/75 text-4xl font-bold z-20"
      >
        Loading...
      </p>
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table table-zebra sm:table-sm table-xs table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <td>#</td>
            <td>Image</td>
            <td>Name</td>
            <td>Description</td>
            <td>Start Data</td>
            <td>End Data</td>
            <td>Discounted Price</td>
            <td>Min Quantity</td>
            <td>Min Purchase Amount</td>
            <td>Bundle Price</td>
            <td>Active</td>
            <td>Created</td>
            <td>Updated</td>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-primary/5"
            :class="!row.promotion_is_active ? 'opacity-50' : ''"
          >
            <td>{{ row.id }}</td>
            <td>
              <div
                v-if="row.image_url"
                class="h-12 w-12 cursor-pointer"
                v-on:click="fnImage.onOpen(row.image_url)"
              >
                <img :src="row.image_url" class="h-full w-full object-cover" />
              </div>
              <div v-else class="h-12 w-12 cursor-not-allowed">
                <img
                  src="@/assets/images/blank.png"
                  class="h-full w-full object-cover"
                />
              </div>
            </td>
            <td>{{ row.promotion_name }}</td>
            <td>{{ row.promotion_description }}</td>
            <td>{{ dayjs(row.promotion_start_date).format("YYYY-MM-DD") }}</td>
            <td>{{ dayjs(row.promotion_end_date).format("YYYY-MM-DD") }}</td>
            <td>{{ row.promotion_discounted_price }}</td>
            <td>{{ row.promotion_min_quantity }}</td>
            <td>{{ row.promotion_min_purchase_amount }}</td>
            <td>{{ row.promotion_bundle_price }}</td>
            <td>
              <input
                type="checkbox"
                class="checkbox checkbox-accent"
                v-model="row.promotion_is_active"
                v-on:click="fnBase.onUseActive(row)"
              />
            </td>
            <td>
              <div>{{ row.created_username ?? row.created_by }}</div>
              <div>
                {{ dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </td>
            <td>
              <div>{{ row.updated_username ?? row.updated_by }}</div>
              <div>
                {{
                  row.updated_at
                    ? dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
                    : ""
                }}
              </div>
            </td>
            <th class="text-end">
              <button
                class="btn btn-xs btn-link"
                v-on:click="fnBase.onEdit(row)"
              >
                แก้ไข
              </button>
              <button
                class="btn btn-xs btn-link btn-error no-underline"
                v-on:click="fnBase.onRemove(row)"
              >
                ลบ
              </button>
            </th>
          </tr>
        </tbody>
      </table>
    </div>
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :disabled="pending"
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import { useDayjs } from "~~/composables/useDayjs";
const dayjs = useDayjs();

const baseModal = ref<HTMLDialogElement | null>(null);
const removeModal = ref<HTMLDialogElement | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const q = ref("");
const base = ref<any>({
  form: {},
  method: "",
});
const detail = ref<any>({
  rows: [],
});
const remove = ref<any>({
  form: {},
  path: "",
});
const imageSrc = ref("");

const { data, pending, error, refresh } = await useFetch("/api/promotion", {
  server: false,
  query: {
    page,
    pageSize,
    q,
  },
  watch: [page, pageSize, q],
});

const fnBase = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";

    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";

    detail.value.rows = [];
    detail.value.rows = await fnDetail.onGet();

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      base.value.method === "post"
        ? `/api/promotion`
        : `/api/promotion/${base.value.form.uuid}`;

    const res: any = await $fetch(path, {
      method: base.value.method,
      body: {
        ...base.value.form
      },
    });

    if (res) {
      if (
        base.value.form.promotion_type ===
        "70977b66-e3d8-45f2-bdfb-b9776f959027"
      ) {
        detail.value.rows = detail.value.rows.map((v: any) => {
          return { ...v, bundle_item_promotion: res.row.uuid };
        });
        await fnDetail.onSubmit();
      }

      baseModal.value?.close();
      refresh();
    }
  },
  onUseActive: async (row: any) => {
    const path = `/api/promotion/${row.uuid}`;

    const res = await $fetch(path, {
      method: "put",
      body: {
        ...row,
        promotion_is_active: row.promotion_is_active ? false : true
      },
    });

    if (res) {
      refresh();
    }
  },
  onRemove: async (row: any) => {
    remove.value.path = "/api/promotion";
    remove.value.form = { ...row };
    removeModal.value?.showModal();
  },
};

const fnDetail = {
  onGet: async () => {
    const res: any = await $fetch(`/api/bundle-items/${base.value.form.uuid}`);
    return res.rows;
  },
  onAddRow: () => {
    detail.value.rows.push({
      bundle_item_product: "",
      bundle_item_quantity: 0,
      bundle_item_unit_price: 0,
    });
  },
  onRemoveRow: (index: number) => {
    detail.value.rows = detail.value.rows.filter(
      (v: any, i: number) => i !== index,
    );
  },
  onSubmit: async () => {
    detail.value.rows.forEach(async (v: any) => {
      const path =
        base.value.method === "post"
          ? `/api/bundle-items`
          : `/api/bundle-items/${v.uuid}`;

      const res = await $fetch(path, {
        method: base.value.method,
        body: {
          ...v
        },
      });
    });
  },
};

const fnRemove = {
  onSubmit: async () => {
    const res = await $fetch(`${remove.value.path}/${remove.value.form.uuid}`, {
      method: "delete",
      body: {
        ...remove.value.form
      },
    });

    if (res) {
      removeModal.value?.close();
      refresh();
    }
  },
};

const fnImage = {
  onOpen: (src: string) => {
    imageSrc.value = src;
    imageModal.value?.showModal();
  },
};

watch(
  () => base.value.form.promotion_type,
  (v) => {
    if (
      v === "70977b66-e3d8-45f2-bdfb-b9776f959027" &&
      base.value.method === "post"
    ) {
      detail.value.rows = [
        {
          bundle_item_product: base.value.form.promotion_product,
          bundle_item_quantity: 0,
          bundle_item_unit_price: 0,
        },
        {
          bundle_item_product: "",
          bundle_item_quantity: 0,
          bundle_item_unit_price: 0,
        },
      ];
    }
  },
);
</script>
