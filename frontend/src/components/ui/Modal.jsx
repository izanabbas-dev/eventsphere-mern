import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const widths = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

// Popup with a fixed header and footer. Only the body scrolls.
export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const panelRef = useRef(null);

  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock the page scroll and move focus into the modal while it is open
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const oldOverflow = body.style.overflow;
    const oldPadding = body.style.paddingRight;
    // Keep the page from jumping when its scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const lastFocused = document.activeElement;
    panelRef.current?.focus();

    return () => {
      body.style.overflow = oldOverflow;
      body.style.paddingRight = oldPadding;
      lastFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] motion-safe:animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative flex max-h-[85vh] w-full ${widths[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 outline-none motion-safe:animate-modal-in`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="modal-title" className="truncate text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
