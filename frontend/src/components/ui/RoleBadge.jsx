import Badge from "./Badge";

const roleColors = { admin: "indigo", exhibitor: "green", attendee: "gray" };

// Same role label and color on every page
export default function RoleBadge({ role }) {
  return <Badge color={roleColors[role]}>{role}</Badge>;
}
