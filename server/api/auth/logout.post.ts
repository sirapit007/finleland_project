export default defineEventHandler((event) => {
  for (const cookie of ["user_token", "admin_token"]) {
    deleteCookie(event, cookie, { path: "/" });
  }

  return {
    success: true,
  };
});
