import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import NewChatModal from "../../components/chat/NewChatModal";
import api from "../../api/axios";
import { startConversation } from "../../api/chatApi";
import useAuth from "../../context/useAuth";
import { useSocketEvent } from "../../context/useSocket";
import { getErrorMessage } from "../../utils/helpers";

function moveToTop(list, conversationId, lastMessage) {
  const conversation = list.find((c) => c._id === conversationId);
  if (!conversation) return list;
  const updated = { ...conversation, lastMessage, updatedAt: lastMessage.createdAt };
  return [updated, ...list.filter((c) => c._id !== conversationId)];
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [chat, setChat] = useState({ id: null, messages: [] });
  const [newChatOpen, setNewChatOpen] = useState(false);

  const loadingMessages = Boolean(activeId) && chat.id !== activeId;

  function addMessage(conversationId, message) {
    setChat((old) => {
      if (old.id !== conversationId || old.messages.some((m) => m._id === message._id)) return old;
      return { ...old, messages: [...old.messages, message] };
    });
  }

  const loadConversations = useCallback(() => {
    return api
      .get("/conversations/my")
      .then((res) => setConversations(res.data.conversations))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;

    api
      .get(`/conversations/${activeId}/messages`)
      .then((res) => {
        setChat({ id: activeId, messages: res.data.messages });
        setConversations((list) =>
          list.map((c) => (c._id === activeId && c.lastMessage ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } } : c))
        );
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setSearchParams({}, { replace: true });
      });
  }, [activeId, setSearchParams]);

  const handleNewMessage = useCallback(
    ({ conversationId, message }) => {
      const isOpen = conversationId === activeId;

      if (isOpen) {
        addMessage(conversationId, message);
        api.get(`/conversations/${conversationId}/messages`).catch(() => {});
      }

      if (conversations.some((c) => c._id === conversationId)) {
        setConversations((list) => moveToTop(list, conversationId, { ...message, isRead: isOpen }));
      } else {
        loadConversations();
      }
    },
    [activeId, conversations, loadConversations]
  );
  useSocketEvent("new_message", handleNewMessage);

  function openConversation(id) {
    setSearchParams({ c: id });
  }

  async function handleSend(text) {
    try {
      const res = await api.post(`/conversations/${activeId}/messages`, { text });
      const message = res.data.newMessage;
      addMessage(activeId, message);
      setConversations((list) => moveToTop(list, activeId, message));
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function handleStartChat(userId, expoId) {
    try {
      const conversation = await startConversation(userId, expoId);
      await loadConversations();
      setNewChatOpen(false);
      openConversation(conversation._id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const activeConversation = conversations.find((c) => c._id === activeId) || null;

  let emptyAction = null;
  if (user.role === "attendee") {
    emptyAction = (
      <Button to="/attendee/exhibitors" variant="secondary" size="sm">
        <Building2 className="h-4 w-4" aria-hidden="true" /> Find exhibitors
      </Button>
    );
  } else if (user.role === "exhibitor") {
    emptyAction = (
      <Button size="sm" variant="secondary" onClick={() => setNewChatOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Start a chat
      </Button>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100dvh-7rem)] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-8rem)]">
        <aside
          className={`w-full flex-col border-r border-slate-200 md:flex md:w-80 md:shrink-0 ${activeId ? "hidden" : "flex"}`}
          aria-label="Conversations"
        >
          <div className="flex h-[65px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            {user.role === "exhibitor" && (
              <Button size="sm" onClick={() => setNewChatOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New chat
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              loading={loadingList}
              activeId={activeId}
              myId={user._id}
              onSelect={openConversation}
              emptyAction={emptyAction}
            />
          </div>
        </aside>

        <section className={`min-w-0 flex-1 flex-col md:flex ${activeId ? "flex" : "hidden"}`} aria-label="Chat">
          <ChatWindow
            key={activeId || "none"}
            conversation={activeConversation}
            messages={loadingMessages ? [] : chat.messages}
            loading={loadingMessages || (Boolean(activeId) && loadingList)}
            myId={user._id}
            onBack={() => setSearchParams({})}
            onSend={handleSend}
          />
        </section>
      </div>

      {user.role === "exhibitor" && (
        <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} myId={user._id} onStart={handleStartChat} />
      )}
    </>
  );
}
