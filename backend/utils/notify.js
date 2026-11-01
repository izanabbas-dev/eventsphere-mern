import Notification from "../models/Notification.js";
import { emitToUser } from "./socket.js";

// Saves the notification and also sends it to the user in real time
export const createNotification = async (data) => {
  const notification = await Notification.create(data);
  emitToUser(notification.user, "notification", notification);
  return notification;
};

export const createNotifications = async (list) => {
  const notifications = await Notification.insertMany(list);
  notifications.forEach((notification) => emitToUser(notification.user, "notification", notification));
  return notifications;
};
