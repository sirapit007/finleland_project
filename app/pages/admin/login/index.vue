<template>
  <main class="grid place-items-center px-4 py-8">
    <section class="w-full max-w-sm">
      <div
        class="mb-6 shadow-sm rounded-box border border-base-300 bg-base-100 p-5"
      >
        <AuthSignInForm admin />
      </div>
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
  const res = await $fetch("/api/auth/login", {
    method: "post",
    body: { username: username.value, password: password.value },
  });

  // console.log(res)
  localStorage.setItem("web-user", JSON.stringify(res.user));
  if (res.token) {
    await navigateTo("/admin/products");
  }
};
</script>
