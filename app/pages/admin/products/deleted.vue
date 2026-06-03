<template>
  <dialog ref="createModal" class="modal">
    <div class="modal-box max-w-4xl">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <h3 class="text-lg font-bold">Create Product</h3>

      <div class="mt-2 grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <!-- {{ base }} -->
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
        <div class="border rounded-md max-h-[51.5vh]">
          <div class="max-h-[90%] overflow-y-auto">
            <table
              class="mt-2 table table-zebra table-xs table-pin-rows table-pin-cols"
            >
              <thead class="text-xs">
                <tr>
                  <th>#</th>
                  <td>Owner</td>
                  <td>Code</td>
                  <td>Name</td>
                  <td>Min</td>
                  <td>Unit</td>
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
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </dialog>

  <dialog ref="restoreModal" class="modal">
    <div class="modal-box max-w-xs">
      <h3 class="text-lg font-bold">ยืนยันที่จะกู้คืนรายการนี้</h3>
      <div class="text-center mt-5">
        <Icon
          name="lucide:message-circle-question-mark"
          class="text-primary"
          size="60"
        />
      </div>
      <div class="modal-action">
        <button
          class="flex-1 btn sm:btn-sm btn-xs"
          @click="restoreModal?.close()"
        >
          ปิด
        </button>
        <button
          class="flex-1 btn sm:btn-sm btn-xs btn-primary"
          type="button"
          @click="onSubmit()"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </dialog>

  <div class="md:p-4 sm:p-2 p-1">
    <div class="flex justify-between">
      <div class="font-bold text-lg">สินค้าที่เคยถูกลบ</div>
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
                class="btn btn-xs btn-link btn-success no-underline"
                v-on:click="onEdit(row)"
              >
                ดู
              </button>
              <button class="btn btn-xs btn-link" v-on:click="onRemove(row)">
                กู้คืน
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
const restoreModal = ref<HTMLDialogElement | null>(null);

const page = ref(1);
const pageSize = ref(10);
const base = ref({
  demo_owner: "",
  demo_code: "",
  demo_name: "",
  demo_min: 0,
  demo_unit: "",
});
const method = ref<any>("post");

const { data, pending, error, refresh } = await useFetch("/api/products", {
  server: false,
  query: {
    page,
    pageSize,
    deleted: true,
  },
  watch: [page, pageSize],
});

const onEdit = async (row: any) => {
  base.value = { ...row };
  method.value = "put";
  createModal.value?.showModal();
};

const onRemove = async (row: any) => {
  base.value = { ...row, deleted_by: null };
  method.value = "put";
  restoreModal.value?.showModal();
};

const onSubmit = async () => {
  const res = await $fetch("/api/products", {
    method: method.value,
    body: {
      ...base.value,
      user: JSON.parse(localStorage.getItem("web-user") || "null"),
    },
  });

  if (res) {
    createModal.value?.close();
    restoreModal.value?.close();
    refresh();
  }
};
</script>
