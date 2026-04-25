import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  Users as UsersIcon,
  Package,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import { formatCurrency, formatNumber, formatRelative } from "../lib/utils.js";

function Kpi({ icon: Icon, label, value, change }) {
  const positive = change >= 0;
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {typeof change === "number" && (
          <div
            className={`mt-3 flex items-center gap-1 text-xs font-medium ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(change)}% from last month
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: api.summary });
  const sales = useQuery({ queryKey: ["sales-by-day"], queryFn: api.salesByDay });
  const activity = useQuery({
    queryKey: ["recent-activity"],
    queryFn: api.recentActivity,
  });

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Total Revenue"
          value={s ? formatCurrency(s.totalRevenue) : "—"}
          change={s?.revenueChangePct}
        />
        <Kpi
          icon={ShoppingBag}
          label="Total Orders"
          value={s ? formatNumber(s.totalOrders) : "—"}
          change={s?.ordersChangePct}
        />
        <Kpi
          icon={UsersIcon}
          label="Total Users"
          value={s ? formatNumber(s.totalUsers) : "—"}
          change={s?.usersChangePct}
        />
        <Kpi
          icon={Package}
          label="Avg Order Value"
          value={s ? formatCurrency(s.averageOrderValue) : "—"}
          change={s?.aovChangePct}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue Overview"
            subtitle="Last 30 days"
          />
          <CardBody>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart
                  data={sales.data || []}
                  margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest actions across your store"
          />
          <CardBody className="space-y-3">
            {(activity.data || []).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  {item.type === "order" ? (
                    <ShoppingCart className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.title}
                  </div>
                  <div className="truncate text-xs text-[var(--color-muted)]">
                    {item.description}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                    {formatRelative(item.timestamp)}
                  </div>
                </div>
                {item.amount && (
                  <div className="shrink-0 text-sm font-semibold text-emerald-600">
                    +{formatCurrency(item.amount)}
                  </div>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
