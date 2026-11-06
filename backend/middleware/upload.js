import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

const PUBLIC_FOLDER = "uploads";
export const PRIVATE_FOLDER = "private_uploads";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

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
