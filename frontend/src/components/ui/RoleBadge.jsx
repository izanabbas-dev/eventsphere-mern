import Badge from "./Badge";

const roleColors = { admin: "indigo", exhibitor: "green", attendee: "gray" };

export default function RoleBadge({ role }) {
  return <Badge color={roleColors[role]}>{role}</Badge>;
}
