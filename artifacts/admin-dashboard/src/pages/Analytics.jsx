import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import { formatCurrency } from "../lib/utils.js";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4"];

export default function Analytics() {
  const sales = useQuery({ queryKey: ["sales-by-day"], queryFn: api.salesByDay });
  const users = useQuery({ queryKey: ["users-by-day"], queryFn: api.usersByDay });
  const cats = useQuery({
    queryKey: ["sales-by-category"],
    queryFn: api.salesByCategory,
  });
  const top = useQuery({ queryKey: ["top-products"], queryFn: api.topProducts });
  const status = useQuery({
    queryKey: ["order-status"],
    queryFn: api.orderStatusBreakdown,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sales over time" subtitle="Last 30 days" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart
                  data={sales.data || []}
                  margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="User signups" subtitle="Last 30 days" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart
                  data={users.data || []}
                  margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Sales by category" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={cats.data || []}
                    dataKey="revenue"
                    nameKey="category"
                    outerRadius={90}
                    label
                  >
                    {(cats.data || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top products" subtitle="By revenue" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart
                  data={top.data || []}
                  margin={{ top: 8, right: 12, left: -10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Order status breakdown"
          subtitle="All-time"
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {(status.data || []).map((s, i) => (
              <div
                key={s.status}
                className="rounded-lg border border-[var(--color-border)] p-4"
              >
                <div
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {s.status}
                </div>
                <div className="mt-1 text-2xl font-semibold">{s.count}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
