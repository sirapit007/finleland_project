export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client || to.path.startsWith("/admin")) {
    return;
  }

  const { clearCurrentUser } = useCurrentUser();

  if (!localStorage.getItem("web-user")) {
    return;
  }

  try {
    const session = await $fetch<{ authenticated: boolean }>(
      "/api/auth/session",
    );

    if (!session.authenticated) {
      clearCurrentUser();
    }
  } catch {
    // Keep local state when the network is unavailable. A confirmed invalid
    // session is the only case that should sign the user out automatically.
  }
});
