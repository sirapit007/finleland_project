<template>
  <dialog ref="baseModal" class="modal">
    <div class="modal-box max-w-7xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Product</h3>

      <div class="mt-2 grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <!-- {{ base.form }} -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Owner</legend>
            <input
              type="text"
              class="input sm:input-sm input-xs w-full"
              placeholder="Example..."
              v-model="base.form.demo_owner"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Code</legend>
            <input
              type="text"
              class="input sm:input-sm input-xs w-full"
              placeholder="Example..."
              v-model="base.form.demo_code"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Name</legend>
            <input
              type="text"
              class="input sm:input-sm input-xs w-full"
              placeholder="Example..."
              v-model="base.form.demo_name"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Min</legend>
            <input
              type="number"
              min="0"
              class="input sm:input-sm input-xs w-full"
              placeholder="Example..."
              v-model="base.form.demo_min"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Unit</legend>
            <input
              type="text"
              class="input sm:input-sm input-xs w-full"
              placeholder="Example..."
              v-model="base.form.demo_unit"
            />
          </fieldset>
        </div>
        <div class="border border-primary/25 rounded-md max-h-[51.75vh]">
          <button
            class="btn btn-xs btn-secondary m-2"
            v-on:click="fnTransaction.onCreate()"
          >
            เพิ่มรายการ
          </button>
          <div class="max-h-[90%] overflow-y-auto">
            <table
              class="mt-2 table table-zebra table-xs table-pin-rows table-pin-cols"
            >
              <thead class="text-xs">
                <tr>
                  <th>#</th>
                  <td>Rack</td>
                  <td>Status</td>
                  <td>Amount</td>
                  <td>Price</td>
                  <td>Comment</td>
                  <td>Created</td>
                  <td>Updated</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in detail?.rows"
                  :key="row.id"
                  class="hover:bg-primary/10"
                >
                  <th>{{ row.id }}</th>
                  <td>{{ row.demo_rack }}</td>
                  <td>{{ row.demo_status }}</td>
                  <td>{{ row.demo_amount }}</td>
                  <td>{{ row.demo_price }}</td>
                  <td>{{ row.demo_comment }}</td>
                  <td>
                    <div>{{ row.created_username ?? row.created_by }}</div>
                    <div>{{ row.created_at }}</div>
                  </td>
                  <td>
                    <div>{{ row.updated_username ?? row.updated_by }}</div>
                    <div>{{ row.updated_at }}</div>
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-xs btn-link"
                      v-on:click="fnTransaction.onEdit(row)"
                    >
                      แก้ไข
                    </button>
                    <button
                      class="btn btn-xs btn-link btn-error no-underline"
                      v-on:click="fnTransaction.onRemove(row)"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="flex-1 btn sm:btn-sm btn-xs" @click="baseModal?.close()">
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-primary"
          type="button"
          @click="fnProduct.onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="detailModal" class="modal">
    <div class="modal-box max-w-sm">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Transaction</h3>

      <div class="mt-2 space-y-2">
        <!-- {{ detail.form }} -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Rack</legend>
          <input
            type="text"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="detail.form.demo_rack"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Amount</legend>
          <input
            type="number"
            min="0"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="detail.form.demo_amount"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Price</legend>
          <input
            type="number"
            min="0"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="detail.form.demo_price"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Comment</legend>
          <textarea
            class="textarea sm:textarea-sm textarea-xs w-full"
            placeholder="Example..."
            v-model="detail.form.demo_comment"
          ></textarea>
        </fieldset>
      </div>

      <div class="modal-action">
        <button
          class="flex-1 btn sm:btn-sm btn-xs"
          @click="detailModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-secondary"
          type="button"
          @click="fnTransaction.onSubmit()"
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

  <div class="md:p-4 sm:p-2 p-1">
    <div class="flex justify-between">
      <div class="font-bold text-lg">สินค้าทั้งหมด</div>
      <div>
        <button
          class="btn sm:btn-sm btn-xs btn-primary"
          v-on:click="fnProduct.onCreate()"
        >
          เพิ่มสินค้า
        </button>
      </div>
    </div>
    <div
      class="max-h-[calc(100dvh-12rem)] overflow-y-auto overflow-x-auto md:my-4 sm:my-2 my-1"
    >
      <!-- <p v-if="pending">Loading...</p> -->
      <p v-if="error" class="text-error">{{ error.message }}</p>

      <table
        class="table table-zebra sm:table-sm table-xs table-pin-rows table-pin-cols"
      >
        <thead class="text-xs">
          <tr>
            <th>#</th>
            <td>Owner</td>
            <td>Code</td>
            <td>Name</td>
            <td>Min</td>
            <td>Unit</td>
            <td>Created</td>
            <td>Updated</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-primary/10"
          >
            <th>{{ row.id }}</th>
            <td>{{ row.demo_owner }}</td>
            <td>{{ row.demo_code }}</td>
            <td>{{ row.demo_name }}</td>
            <td>{{ row.demo_min }}</td>
            <td>{{ row.demo_unit }}</td>
            <td>
              <div>{{ row.created_username ?? row.created_by }}</div>
              <div>{{ row.created_at }}</div>
            </td>
            <td>
              <div>{{ row.updated_username ?? row.updated_by }}</div>
              <div>{{ row.updated_at }}</div>
            </td>
            <td class="text-end">
              <button class="btn btn-xs btn-link" v-on:click="fnProduct.onEdit(row)">
                แก้ไข
              </button>
              <button
                class="btn btn-xs btn-link btn-error no-underline"
                v-on:click="fnProduct.onRemove(row)"
              >
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot class="text-xs">
          <tr>
            <th>#</th>
            <td>Owner</td>
            <td>Code</td>
            <td>Name</td>
            <td>Min</td>
            <td>Unit</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <TablePagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :data="data"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const baseModal = ref<HTMLDialogElement | null>(null);
const detailModal = ref<HTMLDialogElement | null>(null);
const removeModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const base = ref<any>({
  form: {},
  method: "",
});
const detail = ref<any>({
  rows: [],
  form: {},
  method: "",
});
const remove = ref<any>({
  form: {},
  path: "",
});

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
  },
  watch: [page, pageSize],
});

const fnProduct = {
  onCreate: async () => {
    base.value.form = {};
    base.value.method = "post";
    baseModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    base.value.form = { ...row };
    base.value.method = "put";

    detail.value.rows = await fnTransaction.onGet();

    baseModal.value?.showModal();
  },
  onSubmit: async () => {
    const res = await $fetch("/api/products", {
      method: base.value.method,
      body: {
        ...base.value.form,
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      baseModal.value?.close();
      refresh();
    }
  },
  onRemove: async (row: any) => {
    const user = JSON.parse(localStorage.getItem("web-user") || "null");
    remove.value.form = { ...row, deleted_by: user.uuid };
    remove.value.path = `/api/products/${remove.value.form.uuid}`;
    removeModal.value?.showModal();
  },
};

const fnTransaction = {
  onGet: async () => {
    const rows = await $fetch(`/api/transactions/${base.value.form.uuid}`);
    return rows;
  },
  onCreate: async () => {
    detail.value.form = {};
    detail.value.method = "post";
    detailModal.value?.showModal();
  },
  onEdit: async (row: any) => {
    detail.value.form = { ...row };
    detail.value.method = "put";
    detailModal.value?.showModal();
  },
  onSubmit: async () => {
    const path =
      detail.value.method === "post"
        ? `/api/transactions`
        : `/api/transactions/${detail.value.form.uuid}`;

    const res = await $fetch(path, {
      method: detail.value.method,
      body: {
        ...detail.value.form,
        all_products_demo_uuid: base.value.form.uuid,
        demo_status: "ADD",
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      detailModal.value?.close();
      detail.value.rows = await fnTransaction.onGet();
    }
  },
  onRemove: async (row: any) => {
    const user = JSON.parse(localStorage.getItem("web-user") || "null");
    remove.value.form = { ...row, deleted_by: user.uuid };
    remove.value.path = `/api/transactions/${remove.value.form.uuid}`;
    removeModal.value?.showModal();
  },
};

const fnRemove = {
  onSubmit: async () => {
    const res = await $fetch(remove.value.path, {
      method: "put",
      body: {
        ...remove.value.form,
      },
    });

    if (res) {
      if (remove.value.path.startsWith("/api/products")) {
        refresh();
      }

      if (remove.value.path.startsWith("/api/transactions")) {
        detail.value.rows = await fnTransaction.onGet();
      }

      removeModal.value?.close();
    }
  },
};
</script>
