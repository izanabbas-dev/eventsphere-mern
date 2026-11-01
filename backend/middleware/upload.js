import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

// Avatar, logo and banner go to the public folder. Exhibitor documents go to the private one.
const PUBLIC_FOLDER = "uploads";
export const PRIVATE_FOLDER = "private_uploads";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

// File name starts with the user id, so we can check the owner before deleting it
const makeStorage = (folder) => {
  return multer.diskStorage({
    destination: folder,
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const owner = req.user ? req.user._id : "guest";
      cb(null, `${owner}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`);
    },
  });
};

// Checks both the file type and the extension
const makeFileFilter = (allowedTypes, allowedExtensions) => {
  return (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
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

// Images or PDF
export const uploadDocument = multer({
  storage: makeStorage(PRIVATE_FOLDER),
  limits,
  fileFilter: makeFileFilter([...imageTypes, "application/pdf"], [...imageExtensions, ".pdf"]),
});

export const getFileUrl = (file) => `/uploads/${file.filename}`;

const removeFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File was already gone
  }
};

// With ownerId, the file is deleted only if that user uploaded it
export const deleteFile = async (fileUrl, ownerId) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;

  const fileName = path.basename(fileUrl);
  if (ownerId && !fileName.startsWith(`${ownerId}-`)) return;

  await removeFile(path.join(PUBLIC_FOLDER, fileName));
};

export const deletePrivateFile = async (fileName) => {
  if (!fileName) return;
  await removeFile(path.join(PRIVATE_FOLDER, path.basename(fileName)));
};
