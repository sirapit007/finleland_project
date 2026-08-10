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
    thaiBulkSmsOtpKey: process.env.THAIBULKSMS_OTP_KEY,
    thaiBulkSmsOtpSecret: process.env.THAIBULKSMS_OTP_SECRET,
    otpLength: process.env.OTP_LENGTH || "6",
    otpTtlSeconds: process.env.OTP_TTL_SECONDS || "300",
    otpResendCooldownSeconds: process.env.OTP_RESEND_COOLDOWN_SECONDS || "60",
    otpRateLimitWindowSeconds:
      process.env.OTP_RATE_LIMIT_WINDOW_SECONDS || "900",
    otpMaxRequestsPerWindow: process.env.OTP_MAX_REQUESTS_PER_WINDOW || "3",
    otpMaxVerifyAttempts: process.env.OTP_MAX_VERIFY_ATTEMPTS || "5",
    slipOkApiKey: process.env.SLIPOK_API_KEY,
    slipOkBranchId: process.env.SLIPOK_BRANCH_ID,
    slipOkBaseUrl: process.env.SLIPOK_BASE_URL || "https://api.slipok.com",
    slipOkTimeoutMs: process.env.SLIPOK_TIMEOUT_MS || "15000",
    paymentSlipMaxBytes: process.env.PAYMENT_SLIP_MAX_BYTES || "5242880",
    paymentAttemptRateLimit: process.env.PAYMENT_ATTEMPT_RATE_LIMIT || "5",
    paymentAttemptRateWindowMinutes:
      process.env.PAYMENT_ATTEMPT_RATE_WINDOW_MINUTES || "15",
    paymentReceiverBankCode: process.env.PAYMENT_RECEIVER_BANK_CODE || "",
    paymentReceiverAccount: process.env.PAYMENT_RECEIVER_ACCOUNT || "",
    paymentReceiverName: process.env.PAYMENT_RECEIVER_NAME || "",
    paymentReceiverMerchantId: process.env.PAYMENT_RECEIVER_MERCHANT_ID || "",
    public: {
      taxInvoiceSellerName:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_NAME || "ฟินลี่แลนด์ พลาซ่า",
      taxInvoiceSellerTaxId:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_TAX_ID || "",
      taxInvoiceSellerBranch:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_BRANCH || "สำนักงานใหญ่",
      taxInvoiceSellerAddress:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_ADDRESS ||
        "728 ม.4 ต.กลางเวียง อ.เวียงสา จ.น่าน 55110",
      taxInvoiceSellerPhone:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_PHONE || "",
      taxInvoiceSellerEmail:
        process.env.NUXT_PUBLIC_TAX_INVOICE_SELLER_EMAIL || "",
      paymentMerchantQrUrl:
        process.env.NUXT_PUBLIC_PAYMENT_MERCHANT_QR_URL || "",
      paymentMerchantName:
        process.env.NUXT_PUBLIC_PAYMENT_MERCHANT_NAME || "ฟินลี่แลนด์ พลาซ่า",
      paymentMerchantBank: process.env.NUXT_PUBLIC_PAYMENT_MERCHANT_BANK || "",
      paymentMerchantAccount:
        process.env.NUXT_PUBLIC_PAYMENT_MERCHANT_ACCOUNT || "",
      paymentSlipMaxMb: Number(
        process.env.NUXT_PUBLIC_PAYMENT_SLIP_MAX_MB || "5",
      ),
    },
  },
  modules: ["@nuxt/icon"],
});
