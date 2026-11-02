import Badge from "../ui/Badge";

const roleColors = { admin: "indigo", exhibitor: "green", attendee: "gray" };

// Admin is shown as "Organizer" in chats
export default function RoleBadge({ role }) {
  return <Badge color={roleColors[role]}>{role === "admin" ? "Organizer" : role}</Badge>;
}
