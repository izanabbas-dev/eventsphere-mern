import { MessagesSquare } from "lucide-react";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import RoleBadge from "../ui/RoleBadge";
import { isUnread } from "../../api/chatApi";
import { formatChatTime } from "../../utils/helpers";

export default function ConversationList({ conversations, loading, activeId, myId, onSelect, emptyAction }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState icon={MessagesSquare} title="No conversations yet" message="Your chats will show here." action={emptyAction} />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {conversations.map((conversation) => {
        const other = conversation.otherUser || { name: "Deleted user" };
        const last = conversation.lastMessage;
        const unread = isUnread(conversation, myId);
        const fromMe = last && (last.sender?._id || last.sender) === myId;
        const active = conversation._id === activeId;

        return (
          <li key={conversation._id}>
            <button
              type="button"
              onClick={() => onSelect(conversation._id)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-indigo-50" : "hover:bg-slate-50"}`}
            >
              <Avatar src={other.avatar} name={other.name} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                    {other.name}
                  </span>
                  <span className={`shrink-0 text-xs ${unread ? "font-semibold text-indigo-600" : "text-slate-400"}`}>
                    {formatChatTime(last?.createdAt || conversation.updatedAt)}
                  </span>
                </span>

                <span className="mt-0.5 flex items-center gap-2">
                  {other.role && <RoleBadge role={other.role} />}
                  {other.companyName && <span className="truncate text-xs text-slate-500">{other.companyName}</span>}
                </span>

                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? "font-medium text-slate-800" : "text-slate-500"}`}>
                    {last ? `${fromMe ? "You: " : ""}${last.text}` : "No messages yet"}
                  </span>
                  {unread && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600">
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </span>

                {conversation.expo?.title && (
                  <span className="mt-0.5 block truncate text-xs text-slate-400">{conversation.expo.title}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
