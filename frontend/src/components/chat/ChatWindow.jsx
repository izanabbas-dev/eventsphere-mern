import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, MessageSquare, Phone, Send } from "lucide-react";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import RoleBadge from "../ui/RoleBadge";
import { formatChatTime, formatTime, toLocalDateKey } from "../../utils/helpers";

const MAX_LENGTH = 2000;

// "2:30 PM" for today, "12 Mar, 2:30 PM" for older messages
function messageTime(date) {
  const isToday = toLocalDateKey(date) === toLocalDateKey(new Date());
  return isToday ? formatTime(date) : `${formatChatTime(date)}, ${formatTime(date)}`;
}

// The open chat. The parent page gives a new "key" for each conversation, so the input starts empty.
export default function ChatWindow({ conversation, messages, loading, myId, onBack, onSend }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    const ok = await onSend(message);
    setSending(false);
    if (ok) {
      setText("");
      inputRef.current?.focus();
    }
  }

  // Enter sends, Shift + Enter makes a new line
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
  }

  if (!conversation) {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center bg-slate-50 text-indigo-600">
          <Spinner />
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <EmptyState icon={MessageSquare} title="Select a conversation" message="Choose a chat from the list to read and send messages." />
      </div>
    );
  }

  const other = conversation.otherUser || { name: "Deleted user" };

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar src={other.avatar} name={other.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold text-slate-900">{other.name}</h2>
            {other.role && <RoleBadge role={other.role} />}
          </div>
          <p className="truncate text-xs text-slate-500">
            {other.companyName && `${other.companyName} · `}
            {conversation.expo?.title}
          </p>
          {/* Sent by the backend only when this user shares contact info */}
          {(other.email || other.phone) && (
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
              {other.email && (
                <a href={`mailto:${other.email}`} className="flex min-w-0 items-center gap-1 text-indigo-600 hover:underline">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{other.email}</span>
                </a>
              )}
              {other.phone && (
                <a href={`tel:${other.phone}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {other.phone}
                </a>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-5">
        {loading ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const mine = (message.sender?._id || message.sender) === myId;
            return (
              <div key={message._id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm break-words whitespace-pre-wrap shadow-sm sm:max-w-[70%] ${
                    mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
                <span className="mt-1 px-1 text-[11px] text-slate-400">{messageTime(message.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
        <label htmlFor="chat-input" className="sr-only">
          Type a message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-[42px] items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Send</span>
          <span className="sr-only sm:hidden">Send</span>
        </button>
      </form>
    </>
  );
}
