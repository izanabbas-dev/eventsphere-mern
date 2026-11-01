import User from "../models/User.js";
import { disconnectUser } from "../utils/socket.js";

// GET /api/admin/users?role=exhibitor
export const getUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: users.length, users });
};

// PATCH /api/admin/users/:id/status   body: { "isActive": false }
export const updateUserStatus = async (req, res) => {
  if (req.user._id.equals(req.params.id)) {
    return res.status(400).json({ success: false, message: "You cannot change your own status" });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.isActive = req.body.isActive;
  await user.save();

  // A disabled user is logged out of live updates and chat right away
  if (!user.isActive) disconnectUser(user._id);

  res.status(200).json({
    success: true,
    message: user.isActive ? "User activated" : "User disabled",
    user,
  });
};
