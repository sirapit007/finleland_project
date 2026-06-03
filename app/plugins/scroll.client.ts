export default defineNuxtPlugin(() => {
  if (process.client) {
    console.log('[scroll plugin] loaded');
    const router = useRouter();
    router.afterEach(() => {
      setTimeout(() => {
        const scrollContainer =
          document.querySelector('main.overflow-y-auto') ||
          document.querySelector('main');

        if (scrollContainer instanceof HTMLElement) {
          scrollContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }, 50);
    });
  }
});
