<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    columns?: number;
    rows?: number;
    imageColumn?: number;
  }>(),
  {
    columns: 6,
    rows: 7,
    imageColumn: -1,
  },
);

const widthClass = (column: number, row: number) => {
  const widths = ["w-8", "w-24", "w-32", "w-40", "w-20", "w-28"];
  return widths[(column + row) % widths.length];
};
</script>

<template>
  <tr
    v-for="row in props.rows"
    :key="row"
    class="pointer-events-none"
    aria-hidden="true"
  >
    <td v-for="column in props.columns" :key="column">
      <div
        v-if="column - 1 === props.imageColumn"
        class="skeleton h-12 w-12 rounded-lg"
      />
      <div
        v-else
        class="skeleton h-3.5 max-w-full"
        :class="widthClass(column, row)"
      />
    </td>
  </tr>
</template>
