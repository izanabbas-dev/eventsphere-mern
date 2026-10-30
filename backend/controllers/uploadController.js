import { getFileUrl, deleteFile } from "../middleware/upload.js";

// POST /api/uploads/avatar  (form-data field: avatar)
export const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please choose an image to upload" });
  }

  const oldAvatar = req.user.avatar;

  req.user.avatar = getFileUrl(req.file);
  await req.user.save();
  await deleteFile(oldAvatar);

  res.status(200).json({ success: true, message: "Avatar uploaded", avatar: req.user.avatar });
};
