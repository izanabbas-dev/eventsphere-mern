import { fileUrl, getInitials } from "../../utils/helpers";

// Company logo, or the company initials when there is no logo
export default function CompanyLogo({ logo, name, size = "md" }) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";

  if (logo) {
    return (
      <img
        src={fileUrl(logo)}
        alt={`${name} logo`}
        className={`${sizeClass} shrink-0 rounded-xl border border-slate-200 bg-white object-contain`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700`}
      aria-hidden="true"
    >
      {getInitials(name) || "?"}
    </span>
  );
}
