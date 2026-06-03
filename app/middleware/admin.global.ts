export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    return
  }

  if (!to.path.startsWith("/admin")) {
    return;
  }

  // console.log(useRequestHeaders(['cookie']))
  const adminToken = useCookie("admin_token");
  // console.log(adminToken.value)

  const isLoginPage = to.path === "/admin/login";

  if (adminToken.value) {
    if (isLoginPage) {
      return navigateTo("/admin/products");
    }

    return;
  }

  if (!isLoginPage) {
    return navigateTo("/admin/login");
  }
});
