import { Search } from "lucide-react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { SESSION_TYPES } from "../../utils/constants";
import { formatDayKey, getExpoDays } from "../../utils/helpers";

export default function SessionFilters({ expo, sessions, filters, onChange, action }) {
  const topics = [...new Set(sessions.map((s) => s.topic).filter(Boolean))].sort();

  function handleChange(e) {
    onChange({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <Card className="p-4!">
      <div
        className={`grid gap-3 sm:grid-cols-2 lg:items-end ${action ? "lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]" : "lg:grid-cols-[1.5fr_1fr_1fr_1fr]"}`}
      >
        <div className="relative">
          <Input label="Search" name="search" placeholder="Title or speaker" value={filters.search} onChange={handleChange} />
          <Search className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        <Select
          label="Day"
          name="day"
          placeholder="All days"
          options={getExpoDays(expo).map((day) => ({ value: day, label: formatDayKey(day) }))}
          value={filters.day}
          onChange={handleChange}
        />
        <Select
          label="Type"
          name="type"
          placeholder="All types"
          options={SESSION_TYPES.map((type) => ({ value: type, label: type[0].toUpperCase() + type.slice(1) }))}
          value={filters.type}
          onChange={handleChange}
        />
        <Select label="Topic" name="topic" placeholder="All topics" options={topics} value={filters.topic} onChange={handleChange} />
        {action}
      </div>
    </Card>
  );
}
