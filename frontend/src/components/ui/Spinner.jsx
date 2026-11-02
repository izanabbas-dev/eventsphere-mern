const sizes = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-[3px]", lg: "h-12 w-12 border-4" };

export default function Spinner({ size = "md", fullPage = false }) {
  const circle = (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizes[size]}`}
    />
  );

  if (fullPage) {
    return <div className="flex min-h-screen items-center justify-center text-indigo-600">{circle}</div>;
  }
  return circle;
}
