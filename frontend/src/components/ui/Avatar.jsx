import { fileUrl, getInitials } from "../../utils/helpers";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({ src, name, size = "md", className = "" }) {
  const classes = `${sizes[size]} shrink-0 rounded-full ${className}`;

  if (src) {
    return <img src={fileUrl(src)} alt="" className={`${classes} object-cover`} />;
  }

  return (
    <div className={`${classes} flex items-center justify-center bg-indigo-600 font-bold text-white`} aria-hidden="true">
      {getInitials(name)}
    </div>
  );
}
