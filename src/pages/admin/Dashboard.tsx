import { Users, Home, Shield, AlertTriangle, Activity, TrendingUp, Calendar } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAdminAnalytics, TimePeriod } from "@/hooks/useAdminAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#ff6b35', '#f7931e', '#fdc500', '#4caf50', '#2196f3', '#9c27b0'];

const periodLabels: Record<TimePeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  "6months": "6 Months",
  year: "This Year",
  all: "All Time",
};

export default function Dashboard() {
  const { stats, loading, period, setPeriod, propertyTypeData, growthData } = useAdminAnalytics();

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 p-2 md:p-0">
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 md:h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">Overview of your platform statistics</p>
        </div>
        
        {/* Period Tabs - Scrollable on mobile */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="w-full md:w-auto">
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex gap-1 h-auto p-1">
            {Object.entries(periodLabels).map(([key, label]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="text-xs md:text-sm px-2 md:px-3 py-1.5"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="New Users"
          value={stats.newUsers}
          icon={Users}
          description={periodLabels[period]}
        />
        <StatsCard
          title="New Properties"
          value={stats.newProperties}
          icon={Home}
          description={periodLabels[period]}
        />
        <StatsCard
          title="Reported"
          value={stats.reportedProperties}
          icon={AlertTriangle}
          description="Needs review"
          className={stats.reportedProperties > 0 ? "border-destructive" : ""}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="All registered"
        />
        <StatsCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={Home}
          description={`${stats.activeProperties} public`}
        />
        <StatsCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={Shield}
          description={`${stats.totalTenants} total`}
        />
        <StatsCard
          title="Reviews"
          value={stats.totalReviews}
          icon={Activity}
          description="Total reviews"
        />
        <StatsCard
          title="Active Rate"
          value={`${Math.round((stats.activeProperties / Math.max(stats.totalProperties, 1)) * 100)}%`}
          icon={TrendingUp}
          description="Public properties"
        />
      </div>

      {/* Charts - Stack on mobile */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Growth (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  interval="preserveStartEnd"
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#ff6b35" 
                  strokeWidth={2}
                  dot={false}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="properties" 
                  stroke="#4caf50" 
                  strokeWidth={2}
                  dot={false}
                  name="Properties"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Property Types</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            {propertyTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {propertyTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Bar Chart */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Daily Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={growthData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip 
                contentStyle={{ 
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))"
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="users" fill="#ff6b35" name="New Users" radius={[4, 4, 0, 0]} />
              <Bar dataKey="properties" fill="#4caf50" name="New Properties" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
