import api from "./axios";

// Opens my old chat with this user for this expo, or creates a new one
export async function startConversation(userId, expoId) {
  const res = await api.post("/conversations", { userId, expoId });
  return res.data.conversation;
}

// True when the other person sent the last message and I have not read it
export function isUnread(conversation, myId) {
  const last = conversation.lastMessage;
  if (!last) return false;
  const senderId = last.sender?._id || last.sender;
  return senderId !== myId && !last.isRead;
}
