<template>
  <div class="space-y-5 p-5" aria-hidden="true">
    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="item in 3" :key="item" class="space-y-2 rounded-xl bg-base-100 p-4">
        <div class="skeleton h-3 w-24" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-2/3" />
      </div>
    </div>
    <div v-for="item in 3" :key="item" class="flex items-center gap-4 rounded-xl bg-base-100 p-4">
      <div class="skeleton size-14 shrink-0" />
      <div class="min-w-0 flex-1 space-y-2">
        <div class="skeleton h-4 w-2/3" />
        <div class="skeleton h-3 w-32" />
      </div>
      <div class="skeleton h-5 w-20" />
    </div>
  </div>
</template>
