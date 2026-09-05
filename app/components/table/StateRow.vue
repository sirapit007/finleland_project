<template>
  <tr class="admin-table-state-row">
    <td :colspan="columns">
      <div
        v-if="error"
        class="admin-table-empty admin-table-error"
        role="alert"
      >
        <Icon name="lucide:cloud-alert" size="36" aria-hidden="true" />
        <span>โหลดข้อมูลไม่สำเร็จ</span>
        <button type="button" class="admin-table-retry" @click="emit('retry')">
          <Icon name="lucide:rotate-cw" size="15" aria-hidden="true" />ลองใหม่
        </button>
      </div>
      <TableEmptyState v-else :filtered="filtered" />
    </td>
  </tr>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{ columns: number; error?: boolean; filtered?: boolean }>(),
  { error: false, filtered: false },
);
const emit = defineEmits<{ retry: [] }>();
</script>
