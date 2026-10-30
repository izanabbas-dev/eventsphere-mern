import Notification from "../models/Notification.js";

// GET /api/notifications/my
export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { returnDocument: "after" }
  );

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  res.status(200).json({ success: true, message: "Notification marked as read", notification });
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  const result = await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
};
