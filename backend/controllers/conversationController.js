import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Expo from "../models/Expo.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import { createNotification } from "../utils/notify.js";
import { emitToUser } from "../utils/socket.js";
import { canSeeContact } from "../utils/helpers.js";

const getConversationType = (roleA, roleB) => {
  const roles = [roleA, roleB].sort().join("_");
  if (roles === "admin_exhibitor") return "support";
  if (roles === "exhibitor_exhibitor") return "exhibitor_exhibitor";
  if (roles === "attendee_exhibitor") return "attendee_exhibitor";
  return null;
};

const findMyConversation = (conversationId, userId) => {
  return Conversation.findOne({ _id: conversationId, participants: userId });
};

export const startConversation = async (req, res) => {
  const { userId, expoId } = req.body;

  if (req.user._id.equals(userId)) {
    return res.status(400).json({ success: false, message: "You cannot start a chat with yourself" });
  }

  const otherUser = await User.findById(userId);
  if (!otherUser || !otherUser.isActive) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const expo = await Expo.findById(expoId);
  if (!expo || (expo.status === "draft" && req.user.role !== "admin")) {
    return res.status(404).json({ success: false, message: "Expo not found" });
  }

  if (req.user.role === "attendee" && otherUser.role !== "exhibitor") {
    return res.status(403).json({ success: false, message: "Attendees can only start chats with exhibitors" });
  }

  const type = getConversationType(req.user.role, otherUser.role);
  if (!type) {
    return res.status(403).json({ success: false, message: "You cannot start a chat with this user" });
  }

  let conversation = await Conversation.findOne({
    expo: expo._id,
    participants: { $all: [req.user._id, otherUser._id], $size: 2 },
  });
  let statusCode = 200;

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, otherUser._id],
      expo: expo._id,
      type,
    });
    statusCode = 201;
  }

  await conversation.populate("participants", "name role avatar");

  res.status(statusCode).json({ success: true, conversation });
};

export const getMyConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("participants", "name role avatar email phone showContactInfo")
    .populate("lastMessage", "text sender isRead createdAt")
    .populate("expo", "title")
    .lean();

  const userIds = conversations.flatMap((c) => c.participants.filter(Boolean).map((p) => p._id));
  const profiles = await ExhibitorProfile.find({ user: { $in: userIds } }).select("user companyName");

  const result = conversations.map((conversation) => {
    const other = conversation.participants.find((p) => p && !p._id.equals(req.user._id));
    const profile = other && profiles.find((p) => p.user.equals(other._id));
    const showContact = other && canSeeContact(req, other);

    return {
      _id: conversation._id,
      type: conversation.type,
      expo: conversation.expo,
      otherUser: other
        ? {
            _id: other._id,
            name: other.name,
            role: other.role,
            avatar: other.avatar,
            companyName: profile ? profile.companyName : null,
            email: showContact ? other.email : null,
            phone: showContact ? other.phone || null : null,
          }
        : null,
      lastMessage: conversation.lastMessage,
      updatedAt: conversation.updatedAt,
    };
  });

  res.status(200).json({ success: true, count: result.length, conversations: result });
};

export const getMessages = async (req, res) => {
  const conversation = await findMyConversation(req.params.id, req.user._id);

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, isRead: false },
    { isRead: true }
  );

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .populate("sender", "name role avatar");

  res.status(200).json({ success: true, count: messages.length, messages });
};

export const sendMessage = async (req, res) => {
  const conversation = await findMyConversation(req.params.id, req.user._id);

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const receiverId = conversation.participants.find((id) => !id.equals(req.user._id));

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: req.body.text,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  await message.populate("sender", "name role avatar");

  emitToUser(receiverId, "new_message", { conversationId: conversation._id, message });

  const preview = message.text.length > 50 ? `${message.text.slice(0, 50)}...` : message.text;
  await createNotification({
    user: receiverId,
    title: `New message from ${req.user.name}`,
    message: preview,
    type: "message",
    link: `/chat/${conversation._id}`,
  });

  res.status(201).json({ success: true, message: "Message sent", newMessage: message });
};
