import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

// Public files (avatar, logo, banner) are served at /uploads.
// Exhibitor documents go to a private folder that is never served as static files.
const PUBLIC_FOLDER = "uploads";
export const PRIVATE_FOLDER = "private_uploads";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

// File names start with the uploader's user id, e.g. "<userId>-1793384833802-44c4dd1cb344.jpg",
// so we can later check that a file belongs to that user before deleting it
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

// For avatar, logo and banner
export const uploadImage = multer({
  storage: makeStorage(PUBLIC_FOLDER),
  limits,
  fileFilter: makeFileFilter(imageTypes, imageExtensions),
});

// For exhibitor documents (images or PDF), saved in the private folder
export const uploadDocument = multer({
  storage: makeStorage(PRIVATE_FOLDER),
  limits,
  fileFilter: makeFileFilter([...imageTypes, "application/pdf"], [...imageExtensions, ".pdf"]),
});

// Saved in the database as "/uploads/<file name>"
export const getFileUrl = (file) => `/uploads/${file.filename}`;

const removeFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File was already gone, nothing to do
  }
};

// Deletes an old public file, e.g. when a new avatar replaces it.
// With ownerId, the file is deleted only if that user uploaded it.
export const deleteFile = async (fileUrl, ownerId) => {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;

  const fileName = path.basename(fileUrl);
  if (ownerId && !fileName.startsWith(`${ownerId}-`)) return;

  await removeFile(path.join(PUBLIC_FOLDER, fileName));
};

// Deletes a document from the private folder
export const deletePrivateFile = async (fileName) => {
  if (!fileName) return;
  await removeFile(path.join(PRIVATE_FOLDER, path.basename(fileName)));
};
