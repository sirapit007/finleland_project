export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client) {
    return
  }

  if (!to.path.startsWith("/admin")) {
    return;
  }

  const adminToken = useCookie("admin_token");

  const isLoginPage = to.path === "/admin/login";

  if (adminToken.value) {
    if (isLoginPage) {
      return navigateTo("/admin");
    }

    return;
  }

  if (!isLoginPage) {
    return navigateTo("/admin/login");
  }
});
