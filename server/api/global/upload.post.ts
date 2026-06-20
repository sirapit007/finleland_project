import cloudinary from "~~/server/utils/cloudinary";

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event);

  if (!files)
    throw createError({
      statusCode: 400,
      message: "No file",
    });

  const image = files.find((f) => f.name === "file");

  if (!image)
    throw createError({
      statusCode: 400,
      message: "Image not found",
    });

  const base64 = image.data.toString("base64");

  const result = await cloudinary.uploader.upload(
    `data:${image.type};base64,${base64}`,
    {
      folder: "products",
    },
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
});
