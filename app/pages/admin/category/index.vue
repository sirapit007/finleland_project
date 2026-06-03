<template>
  <dialog ref="createModal" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Create Product</h3>

      <div class="mt-4 space-y-3">
        {{ base }}
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Owner</legend>
          <input
            type="text"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="base.demo_owner"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Code</legend>
          <input
            type="text"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="base.demo_code"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Name</legend>
          <input
            type="text"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="base.demo_name"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Min</legend>
          <input
            type="number"
            min="0"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="base.demo_min"
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Unit</legend>
          <input
            type="text"
            class="input sm:input-sm input-xs w-full"
            placeholder="Example..."
            v-model="base.demo_unit"
          />
        </fieldset>
      </div>

      <div class="modal-action">
        <button
          class="flex-1 btn sm:btn-sm btn-xs"
          @click="createModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-primary"
          type="button"
          @click="onSubmit()"
        >
          บันทึก
        </button>
      </div>
    </div>
  </dialog>

  <div class="md:p-4 sm:p-2 p-1">
    <div class="flex justify-between">
      <div class="font-bold text-lg">หมวดหมู่ของสินค้า</div>
      <div>
        <button
          class="btn sm:btn-sm btn-xs btn-primary"
          v-on:click="onCreate()"
        >
          เพิ่มหมวดหมู่
        </button>
      </div>
    </div>
    <div
      class="max-h-[calc(100dvh-15rem)] overflow-y-auto overflow-x-auto md:my-4 sm:my-2 my-1"
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
            <td class="text-end">
              <button
                class="btn btn-xs btn-link"
                v-on:click="onEdit(row)"
              >
                แก้ไข
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

const createModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const base = ref({
    demo_owner: "",
    demo_code: "",
    demo_name: "",
    demo_min: 0,
    demo_unit: "",
  });

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
  },
  watch: [page, pageSize],
});

const onCreate = async () => {
  base.value = {
    demo_owner: "",
    demo_code: "",
    demo_name: "",
    demo_min: 0,
    demo_unit: "",
  };
  createModal.value?.showModal();
};

const onEdit = async (row: any) => {
  base.value = row;
  createModal.value?.showModal();
};

const onSubmit = async () => {
  const res = await $fetch("/api/products", {
    method: "post",
    body: {
      ...base.value,
      user: JSON.parse(localStorage.getItem("web-user") || "null"),
    },
  });

  if (res) {
    createModal.value?.close();
    refresh();
  }
};
</script>
