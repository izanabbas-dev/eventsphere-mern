export default function Textarea({ label, name, error, required, rows = 4, className = "", ...props }) {
  const id = props.id || name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm
          transition placeholder:text-slate-400 focus:outline-none focus:ring-2
          ${error ? "border-red-500 focus:ring-red-500/30" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30"}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
