<template>
  <div class="p-4 bg-base-100">
    <div class="flex md:flex-row flex-col justify-between">
      <div class="space-x-3 xl:flex grid">
        <span class="font-bold text-xl text-primary"
          >Manage Promotion Types</span
        ><span class="font-semibold text-base text-secondary"
          >จัดการประเภทโปรโมชั่น</span
        >
      </div>
      <div class="flex items-center gap-4">
        <label class="input sm:input-sm input-xs shadow-sm w-68">
          <span class="label"><Icon name="lucide:search" size="16" /></span>
          <input
            type="text"
            placeholder="ค้นหาชื่อประเภทโปรโมชั่น หรือคำค้นหา..."
            v-model="q"
          />
        </label>
      </div>
    </div>
    <div
      class="min-h-[calc(100dvh-12.5rem)] max-h-[calc(100dvh-12.5rem)] overflow-y-auto overflow-x-auto my-4 relative border border-base-content/10 rounded-lg shadow-sm"
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
            <td>Code</td>
            <td>Name</td>
            <td>Description</td>
            <td>Active</td>
            <td>Created</td>
            <td>Updated</td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data?.rows"
            :key="row.id"
            class="hover:bg-primary/5"
            :class="!row.promotion_type_is_active ? 'opacity-50' : ''"
          >
            <td>{{ row.id }}</td>
            <td>{{ row.promotion_type_code }}</td>
            <td>{{ row.promotion_type_name }}</td>
            <td>{{ row.promotion_type_description }}</td>
            <td>
              <input
                type="checkbox"
                class="checkbox checkbox-accent"
                v-model="row.promotion_type_is_active"
                v-on:click="fnBase.onSubmit(row)"
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
import { useDayjs } from "~~/composables/useDayjs";

definePageMeta({
  layout: "admin",
});

const dayjs = useDayjs();

const page = ref(1);
const pageSize = ref(10);
const q = ref("");

const { data, pending, error, refresh } = await useFetch(
  "/api/promotion/types",
  {
    server: false,
    query: {
      page,
      pageSize,
      q,
    },
    watch: [page, pageSize, q],
  },
);

const fnBase = {
  onSubmit: async (row: any) => {
    const path = `/api/promotion/types/${row.uuid}`;

    const res = await $fetch(path, {
      method: "put",
      body: {
        ...row,
        promotion_type_is_active: row.promotion_type_is_active ? false : true,
        user: JSON.parse(localStorage.getItem("web-user") || "null"),
      },
    });

    if (res) {
      refresh();
    }
  },
};
</script>
