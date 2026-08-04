import { createHash } from "node:crypto";
import cloudinary from "@@/server/utils/cloudinary";

export type ValidatedPaymentSlip = {
  data: Buffer;
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  size: number;
  sha256: string;
};

const isPng = (data: Buffer) =>
  data.length >= 8 &&
  data
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isJpeg = (data: Buffer) =>
  data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
const isWebp = (data: Buffer) =>
  data.length >= 12 &&
  data.subarray(0, 4).toString("ascii") === "RIFF" &&
  data.subarray(8, 12).toString("ascii") === "WEBP";

const safeFilename = (value: string, extension: string) => {
  const base = value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "payment-slip"}.${extension}`;
};

export function validatePaymentSlip(input: {
  data: Buffer;
  filename?: string;
  declaredMimeType?: string;
  maxBytes: number;
}): ValidatedPaymentSlip {
  if (!input.data.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "ไฟล์สลิปไม่มีข้อมูล",
    });
  }
  if (input.data.length > input.maxBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: `ไฟล์สลิปต้องมีขนาดไม่เกิน ${Math.ceil(input.maxBytes / 1_048_576)} MB`,
    });
  }

  let mimeType: ValidatedPaymentSlip["mimeType"];
  let extension: ValidatedPaymentSlip["extension"];
  if (isJpeg(input.data)) {
    mimeType = "image/jpeg";
    extension = "jpg";
  } else if (isPng(input.data)) {
    mimeType = "image/png";
    extension = "png";
  } else if (isWebp(input.data)) {
    mimeType = "image/webp";
    extension = "webp";
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: "รองรับเฉพาะไฟล์สลิป JPG, JPEG, PNG และ WEBP",
    });
  }

  const declaredMimeType = String(input.declaredMimeType || "")
    .toLowerCase()
    .trim();
  const acceptedDeclaredTypes = new Set([
    "",
    mimeType,
    ...(mimeType === "image/jpeg" ? ["image/jpg", "image/jfif"] : []),
  ]);
  if (!acceptedDeclaredTypes.has(declaredMimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ชนิดไฟล์ที่แจ้งมาไม่ตรงกับข้อมูลจริงของรูปภาพ",
    });
  }

  return {
    data: input.data,
    filename: safeFilename(input.filename || "payment-slip", extension),
    mimeType,
    extension,
    size: input.data.length,
    sha256: createHash("sha256").update(input.data).digest("hex"),
  };
}

export async function uploadAuthenticatedPaymentSlip(
  slip: ValidatedPaymentSlip,
  orderUuid: string,
) {
  const dataUri = `data:${slip.mimeType};base64,${slip.data.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "payment-slips",
    resource_type: "image",
    type: "authenticated",
    unique_filename: true,
    overwrite: false,
    context: { order_uuid: orderUuid },
    tags: ["payment-slip", `order-${orderUuid}`],
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

export async function destroyAuthenticatedPaymentSlip(publicId: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "authenticated",
    invalidate: true,
  });
}

export function createAuthenticatedPaymentSlipUrl(
  publicId: string,
  extension: ValidatedPaymentSlip["extension"],
) {
  return cloudinary.utils.private_download_url(publicId, extension, {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    attachment: false,
  });
}
