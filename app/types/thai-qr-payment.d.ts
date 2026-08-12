declare module "thai-qr-payment" {
  export type PromptPayRecipientType = "mobile" | "nationalId" | "eWallet";

  export type QRErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  export interface RenderThaiQRPaymentMatrixOptions {
    recipient: string;
    amount?: number | bigint;
    recipientType?: PromptPayRecipientType;
    fromSatang?: boolean;
    errorCorrectionLevel?: QRErrorCorrectionLevel;
    size?: number;
    quietZone?: number;
    foreground?: string;
    background?: string;
    rootAttributes?: Record<string, string>;
  }

  export function renderThaiQRPaymentMatrix(
    options: RenderThaiQRPaymentMatrixOptions,
  ): string;
}
