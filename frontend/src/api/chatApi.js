import api from "./axios";

export async function startConversation(userId, expoId) {
  const res = await api.post("/conversations", { userId, expoId });
  return res.data.conversation;
}

export function isUnread(conversation, myId) {
  const last = conversation.lastMessage;
  if (!last) return false;
  const senderId = last.sender?._id || last.sender;
  return senderId !== myId && !last.isRead;
}
