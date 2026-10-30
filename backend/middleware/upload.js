import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

// Files are saved in the uploads folder with a random name
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`);
  },
});

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

// For avatar, logo and banner
export const uploadImage = multer({
  storage,
  limits,
  fileFilter: makeFileFilter(imageTypes, imageExtensions),
});

// For exhibitor documents (images or PDF)
export const uploadDocument = multer({
  storage,
  limits,
  fileFilter: makeFileFilter([...imageTypes, "application/pdf"], [...imageExtensions, ".pdf"]),
});

// Saved in the database as "/uploads/<file name>"
export const getFileUrl = (file) => `/uploads/${file.filename}`;

// Deletes an old uploaded file, e.g. when a new avatar replaces it
export const deleteFile = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  try {
    await fs.unlink(path.join("uploads", path.basename(fileUrl)));
  } catch (error) {
    // File was already gone, nothing to do
  }
};
