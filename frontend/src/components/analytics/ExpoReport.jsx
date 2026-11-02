import { useCallback, useEffect, useState } from "react";
import { BarChart3, ClipboardList, RefreshCw, Star, Store, Users } from "lucide-react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import StatCard from "../ui/StatCard";
import EmptyState from "../ui/EmptyState";
import api from "../../api/axios";
import { useSocketEvent } from "../../context/useSocket";
import { formatDate, getErrorMessage } from "../../utils/helpers";

// Same colors as the floor plan and badges
const COLORS = {
  indigo: "#4f46e5",
  amber: "#f59e0b",
  green: "#16a34a",
  red: "#dc2626",
  gray: "#94a3b8",
};

const boothColors = { available: COLORS.green, reserved: COLORS.amber, booked: COLORS.indigo };
const applicationColors = {
  pending: COLORS.amber,
  approved: COLORS.green,
  rejected: COLORS.red,
  withdrawn: COLORS.gray,
};

const axisProps = { tick: { fontSize: 12, fill: "#64748b" }, tickLine: false, axisLine: false };
const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 };

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

// Long names are cut so the chart fits on mobile
function shortText(text, max = 14) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Full report of one expo. The parent page joins the expo room for live updates.
export default function ExpoReport({ expoId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(() => {
    api
      .get(`/analytics/expos/${expoId}`)
      .then((res) => setReport(res.data.report))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [expoId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // A booth or session of this expo changed: load fresh numbers
  useSocketEvent("booth_updated", loadReport);
  useSocketEvent("schedule_updated", loadReport);

  function handleRefresh() {
    setRefreshing(true);
    loadReport();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Could not load the report"
          action={<Button onClick={handleRefresh}>Try again</Button>}
        />
      </Card>
    );
  }

  const booths = report.boothsByStatus;
  const totalBooths = booths.available + booths.reserved + booths.booked;
  const totalApplications = Object.values(report.applicationsByStatus).reduce((sum, n) => sum + n, 0);

  const attendeeData = report.attendeesPerDay.map((day) => ({ ...day, label: formatDate(day.date).slice(0, -5) }));
  const boothData = Object.entries(booths)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: capitalize(status), status, count }));
  const applicationData = Object.entries(report.applicationsByStatus).map(([status, count]) => ({
    name: capitalize(status),
    status,
    count,
  }));
  const topBooths = report.topBooths.map((booth) => ({
    name: booth.hall ? `${booth.boothNumber} (${booth.hall})` : booth.boothNumber,
    visits: booth.visits,
  }));
  const topSessions = report.topSessions.filter((s) => s.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total attendees" value={report.totalAttendees} icon={Users} />
        <StatCard
          label="Booths booked"
          value={`${booths.booked} / ${totalBooths}`}
          icon={Store}
          color="sky"
          hint={`${booths.available} available · ${booths.reserved} reserved`}
        />
        <StatCard
          label="Applications"
          value={totalApplications}
          icon={ClipboardList}
          color="green"
          hint={`${report.applicationsByStatus.pending} pending`}
        />
        <StatCard
          label="Average rating"
          value={report.feedback.averageRating ? `${report.feedback.averageRating} / 5` : "-"}
          icon={Star}
          color="amber"
          hint={`From ${report.feedback.count} feedback`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Attendees per day" subtitle="New registrations each day" isEmpty={attendeeData.length === 0} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={attendeeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendeeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" {...axisProps} minTickGap={16} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                name="Attendees"
                stroke={COLORS.indigo}
                strokeWidth={2}
                fill="url(#attendeeFill)"
                dot={{ r: 4, fill: COLORS.indigo, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booths by status" subtitle={`${totalBooths} booths in total`} isEmpty={totalBooths === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={boothData} dataKey="count" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="#fff">
                {boothData.map((item) => (
                  <Cell key={item.status} fill={boothColors[item.status]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="text-sm text-slate-600">
                    {value}: {entry.payload.count}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications by status" subtitle={`${totalApplications} applications`} isEmpty={totalApplications === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applicationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {applicationData.map((item) => (
                  <Cell key={item.status} fill={applicationColors[item.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booth traffic" subtitle="Top 5 booths by visits" isEmpty={topBooths.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topBooths} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="name" width={90} {...axisProps} tickFormatter={(v) => shortText(v, 12)} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="visits" name="Visits" fill={COLORS.indigo} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Session popularity" subtitle="Top 5 sessions by registrations and bookmarks" isEmpty={topSessions.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSessions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="title" {...axisProps} interval={0} tickFormatter={(v) => shortText(v, 10)} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
              <Legend iconType="circle" formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} />
              <Bar dataKey="registrations" name="Registrations" fill={COLORS.indigo} radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="bookmarks" name="Bookmarks" fill={COLORS.amber} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, isEmpty, className = "", children }) {
  return (
    <Card className={`min-w-0 p-4! sm:p-6! ${className}`}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">
        {isEmpty ? <EmptyState icon={BarChart3} title="No data yet" message="This chart will fill in as people use the expo." /> : children}
      </div>
    </Card>
  );
}
