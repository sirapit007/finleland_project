<template>
  <main class="grid min-h-[calc(100dvh_-_7rem)] place-items-center px-4 py-8">
    <section class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <p class="text-sm font-medium text-primary">Admin Panel</p>
        <h1 class="mt-2 text-2xl font-bold text-base-content">Sign in</h1>
        <p class="mt-2 text-sm text-base-content/60">
          Manage products, stock, and orders from one place.
        </p>
      </div>

      <form class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
        <fieldset class="fieldset">
          <label class="fieldset-label" for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="username"
            class="input input-bordered w-full"
            placeholder="Enter username"
            autocomplete="username"
          />
        </fieldset>

        <fieldset class="fieldset mt-3">
          <label class="fieldset-label" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input input-bordered w-full"
            placeholder="Enter password"
            autocomplete="current-password"
          />
        </fieldset>

        <div class="mt-4 flex items-center justify-between gap-3 text-sm">
          <label class="label cursor-pointer gap-2 p-0">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm"
            />
            <span class="label-text">Remember me</span>
          </label>

          <NuxtLink to="/admin/forgot-password" class="link link-primary">
            Forgot password?
          </NuxtLink>
        </div>

        <button class="btn btn-primary mt-6 w-full" type="button" v-on:click="onSubmit()">
          Sign in
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin-auth",
});

const username = ref("");
const password = ref("");
const rememberMe = ref(false);

const onSubmit = async () => {
  const res  = await $fetch('/api/auth/login', {
    method: 'post',
    body: { username: username.value, password: password.value },
  })

  // console.log(res)
  localStorage.setItem("web-user", JSON.stringify(res.user));
  if (res.token) {
    await navigateTo('/admin/products')
  }
}
</script>
