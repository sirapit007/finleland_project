export type SlipOkParty = {
  displayName?: string | null;
  name?: string | null;
  proxy?: { type?: string | null; value?: string | null } | null;
  account?: { type?: string | null; value?: string | null } | null;
};

export type SlipOkTransaction = {
  success?: boolean;
  message?: string;
  rqUID?: string;
  transRef?: string;
  transDate?: string;
  transTime?: string;
  transTimestamp?: string;
  sendingBank?: string;
  receivingBank?: string;
  sender?: SlipOkParty | null;
  receiver?: SlipOkParty | null;
  amount?: number;
  paidLocalAmount?: number;
  paidLocalCurrency?: string;
  countryCode?: string;
  ref1?: string;
  ref2?: string;
  ref3?: string;
  toMerchantId?: string;
  qrcodeData?: string;
  bankCode?: string;
  bankName?: string;
  delay?: number;
};

export type SlipOkResponseBody = {
  success?: boolean;
  code?: number | string;
  message?: string;
  data?: SlipOkTransaction;
  [key: string]: unknown;
};

export type SlipOkVerificationResult = {
  httpStatus: number;
  body: SlipOkResponseBody;
};

export class SlipOkConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlipOkConnectionError";
  }
}

const positiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export async function verifySlipWithSlipOk(input: {
  data: Buffer;
  filename: string;
  mimeType: string;
  amount: number;
}): Promise<SlipOkVerificationResult> {
  const config = useRuntimeConfig();
  const apiKey = String(config.slipOkApiKey || "").trim();
  const branchId = String(config.slipOkBranchId || "").trim();
  const baseUrl = String(config.slipOkBaseUrl || "https://api.slipok.com")
    .trim()
    .replace(/\/$/, "");

  if (!apiKey || !branchId) {
    throw new SlipOkConnectionError(
      "SLIPOK_API_KEY หรือ SLIPOK_BRANCH_ID ยังไม่ได้ตั้งค่า",
    );
  }

  const timeoutMs = positiveInteger(config.slipOkTimeoutMs, 15_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const formData = new FormData();
  formData.append(
    "files",
    new Blob([new Uint8Array(input.data)], { type: input.mimeType }),
    input.filename,
  );
  formData.append("amount", input.amount.toFixed(2));
  formData.append("log", "true");

  try {
    const response = await fetch(
      `${baseUrl}/api/line/apikey/${encodeURIComponent(branchId)}`,
      {
        method: "POST",
        headers: { "x-authorization": apiKey },
        body: formData,
        signal: controller.signal,
      },
    );
    const responseText = await response.text();
    let body: SlipOkResponseBody;

    try {
      body = responseText
        ? (JSON.parse(responseText) as SlipOkResponseBody)
        : {};
    } catch {
      body = {
        message: `SlipOK ส่งข้อมูลที่อ่านไม่ได้ (HTTP ${response.status})`,
      };
    }

    return { httpStatus: response.status, body };
  } catch (error: any) {
    const timedOut = error?.name === "AbortError";
    throw new SlipOkConnectionError(
      timedOut
        ? "SlipOK ใช้เวลาตอบกลับนานเกินกำหนด"
        : "ไม่สามารถเชื่อมต่อ SlipOK ได้",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function parseSlipOkTransactionAt(
  transaction?: SlipOkTransaction | null,
) {
  if (!transaction) return null;
  if (transaction.transTimestamp) {
    const timestamp = new Date(transaction.transTimestamp);
    if (!Number.isNaN(timestamp.getTime())) return timestamp;
  }

  const date = String(transaction.transDate || "");
  const time = String(transaction.transTime || "");
  if (!/^\d{8}$/.test(date) || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const timestamp = new Date(
    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time}+07:00`,
  );
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}
