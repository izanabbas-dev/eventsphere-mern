import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

const PUBLIC_FOLDER = "uploads";
export const PRIVATE_FOLDER = "private_uploads";
const CLOUD_FOLDER = "eventsphere";

export const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const makeFileName = (req, file) => {
  const owner = req.user ? req.user._id : "guest";
  return `${owner}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
};

const makeStorage = (folder) => {
  if (useCloudinary) return multer.memoryStorage();

  return multer.diskStorage({
    destination: folder,
    filename: (req, file, cb) => {
      cb(null, makeFileName(req, file) + path.extname(file.originalname).toLowerCase());
    },
  });
};

const makeFileFilter = (allowedTypes, allowedExtensions) => {
  return (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      if (useCloudinary) file.cloudName = makeFileName(req, file);
      return cb(null, true);
    }

    const error = new Error(`Only ${allowedExtensions.join(", ")} files are allowed`);
    error.statusCode = 400;
    cb(error);
  };
};

const limits = { fileSize: 5 * 1024 * 1024 };

export const uploadImage = multer({
  storage: makeStorage(PUBLIC_FOLDER),
  limits,
  fileFilter: makeFileFilter(imageTypes, imageExtensions),
});

export const uploadDocument = multer({
  storage: makeStorage(PRIVATE_FOLDER),
  limits,
  fileFilter: makeFileFilter([...imageTypes, "application/pdf"], [...imageExtensions, ".pdf"]),
});

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => (error ? reject(error) : resolve(result)))
      .end(buffer);
  });
};

// folder: "avatars", "logos" or "banners". Returns the url to save in the database.
export const saveImage = async (file, folder) => {
  if (!useCloudinary) return `/uploads/${file.filename}`;

  const result = await uploadToCloudinary(file.buffer, {
    folder: `${CLOUD_FOLDER}/${folder}`,
    public_id: file.cloudName,
    resource_type: "image",
  });
  return result.secure_url;
};

// Returns the value to save in document.fileName
export const saveDocument = async (file) => {
  if (!useCloudinary) return file.filename;

  const result = await uploadToCloudinary(file.buffer, {
    folder: `${CLOUD_FOLDER}/documents`,
    public_id: file.cloudName + path.extname(file.originalname).toLowerCase(),
    resource_type: "raw",
    type: "authenticated",
  });
  return result.public_id;
};

// Removes a local file that multer saved but we did not use
export const discardFiles = async (files) => {
  for (const file of files) {
    if (file.path) await removeFile(file.path);
  }
};

const isCloudDocument = (fileName) => fileName.startsWith(`${CLOUD_FOLDER}/`);

export const getDocumentUrl = (fileName) => {
  if (!isCloudDocument(fileName)) return null;

  return cloudinary.utils.private_download_url(fileName, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
};

const removeFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File was already gone
  }
};

const removeFromCloudinary = async (publicId, options) => {
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true, ...options });
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
};

// https://res.cloudinary.com/<cloud>/image/upload/v123/eventsphere/logos/abc.png -> eventsphere/logos/abc
const getPublicId = (fileUrl) => {
  const match = fileUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
};

export const deleteFile = async (fileUrl, ownerId) => {
  if (!fileUrl) return;

  if (fileUrl.startsWith("https://res.cloudinary.com/")) {
    const publicId = getPublicId(fileUrl);
    if (!useCloudinary || !publicId || !publicId.startsWith(`${CLOUD_FOLDER}/`)) return;
    if (ownerId && !path.basename(publicId).startsWith(`${ownerId}-`)) return;

    return removeFromCloudinary(publicId, { resource_type: "image" });
  }

  if (!fileUrl.startsWith("/uploads/")) return;

  const fileName = path.basename(fileUrl);
  if (ownerId && !fileName.startsWith(`${ownerId}-`)) return;

  await removeFile(path.join(PUBLIC_FOLDER, fileName));
};

export const deletePrivateFile = async (fileName) => {
  if (!fileName) return;

  if (isCloudDocument(fileName)) {
    if (useCloudinary) await removeFromCloudinary(fileName, { resource_type: "raw", type: "authenticated" });
    return;
  }

  await removeFile(path.join(PRIVATE_FOLDER, path.basename(fileName)));
};
