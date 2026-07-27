// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          sizes: "16x16 32x32 48x48",
          href: "/favicon.ico?v=3",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png?v=3",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png?v=3",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
      meta: [
        {
          name: "theme-color",
          content: "#0068b5",
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss() as any],
    server: {
      // Allow temporary Cloudflare Tunnel URLs during local webhook testing.
      allowedHosts: [".trycloudflare.com"],
    },
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    dbSsl: process.env.DB_SSL ?? "true",
    lineLoginChannelId: process.env.LINE_LOGIN_CHANNEL_ID,
    lineLoginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
    lineLoginCallbackUrl: process.env.LINE_LOGIN_CALLBACK_URL,
    lineProviderId: process.env.LINE_PROVIDER_ID,
    lineStateSecret: process.env.LINE_STATE_SECRET,
    lineMessagingChannelSecret: process.env.LINE_MESSAGING_CHANNEL_SECRET,
    lineMessagingChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    lineAdminGroupId: process.env.LINE_ADMIN_GROUP_ID,
    shippingGeocodingBaseUrl:
      process.env.SHIPPING_GEOCODING_BASE_URL ||
      "https://nominatim.openstreetmap.org",
    shippingRoutingBaseUrl:
      process.env.SHIPPING_ROUTING_BASE_URL ||
      "https://router.project-osrm.org",
    shippingMapUserAgent:
      process.env.SHIPPING_MAP_USER_AGENT || "FinlelandShoppingBasket/1.0",
  },
  modules: ["@nuxt/icon"],
});
