import { 
  useGetDashboardSummary, 
  useGetSalesByDay,
  useGetUsersByDay,
  useGetSalesByCategory,
  useGetTopProducts,
  useGetRecentActivity,
  useGetOrderStatusBreakdown
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";

function StatCard({ title, value, change, icon: Icon, isLoading }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {change > 0 ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              ) : change < 0 ? (
                <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
              ) : null}
              <span className={change > 0 ? "text-emerald-500 font-medium" : change < 0 ? "text-destructive font-medium" : ""}>
                {Math.abs(change)}%
              </span>
              {" from last month"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: salesByDay, isLoading: loadingSales } = useGetSalesByDay();
  const { data: recentActivity, isLoading: loadingActivity } = useGetRecentActivity();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={summary ? `$${summary.totalRevenue.toLocaleString()}` : "$0"} 
          change={summary?.revenueChangePct || 0} 
          icon={DollarSign} 
          isLoading={loadingSummary} 
        />
        <StatCard 
          title="Total Orders" 
          value={summary?.totalOrders.toLocaleString() || "0"} 
          change={summary?.ordersChangePct || 0} 
          icon={ShoppingCart} 
          isLoading={loadingSummary} 
        />
        <StatCard 
          title="Total Users" 
          value={summary?.totalUsers.toLocaleString() || "0"} 
          change={summary?.usersChangePct || 0} 
          icon={Users} 
          isLoading={loadingSummary} 
        />
        <StatCard 
          title="Avg Order Value" 
          value={summary ? `$${summary.averageOrderValue.toLocaleString()}` : "$0"} 
          change={summary?.aovChangePct || 0} 
          icon={Package} 
          isLoading={loadingSummary} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loadingSales ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => [`$${value}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your store</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className={`p-2 rounded-full flex items-center justify-center
                      ${activity.type === 'order' ? 'bg-primary/10 text-primary' : 
                        activity.type === 'signup' ? 'bg-emerald-500/10 text-emerald-500' :
                        activity.type === 'refund' ? 'bg-destructive/10 text-destructive' :
                        'bg-blue-500/10 text-blue-500'}`}>
                      {activity.type === 'order' ? <ShoppingCart className="h-4 w-4" /> :
                       activity.type === 'signup' ? <Users className="h-4 w-4" /> :
                       activity.type === 'refund' ? <DollarSign className="h-4 w-4" /> :
                       <Package className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <div className="font-medium text-sm">
                        {activity.type === 'refund' ? '-' : '+'}${activity.amount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
