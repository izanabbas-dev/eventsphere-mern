export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="no-scrollbar overflow-x-auto overflow-y-hidden">
      <div role="tablist" className="flex w-max min-w-full gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const selected = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.value)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                selected
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
