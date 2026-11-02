import { useState } from "react";
import { Plus, X } from "lucide-react";

// List of short words, e.g. products. Type and press Enter (or comma) to add.
export default function TagInput({ label, name, tags, onChange, placeholder = "Type and press Enter", hint }) {
  const [text, setText] = useState("");

  function addTag() {
    const value = text.trim();
    if (!value) return;
    const exists = tags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...tags, value]);
    setText("");
  }

  function removeTag(index) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !text && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30">
        {tags.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <li
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pr-1 pl-3 text-sm font-medium text-indigo-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  aria-label={`Remove ${tag}`}
                  className="rounded-full p-0.5 hover:bg-indigo-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            id={name}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-w-0 flex-1 px-1.5 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add
          </button>
        </div>
      </div>
      {hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
