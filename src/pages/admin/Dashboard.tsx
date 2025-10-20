import { Users, Home, Shield, Receipt, MessageSquare, TrendingUp, DollarSign, Activity } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAdminData } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

const COLORS = ['#ff6b35', '#f7931e', '#fdc500', '#4caf50'];

export default function Dashboard() {
  const { stats, loading } = useAdminData();

  // Mock data for charts
  const userGrowthData = [
    { month: 'Jan', users: 12 },
    { month: 'Feb', users: 15 },
    { month: 'Mar', users: 18 },
    { month: 'Apr', users: 20 },
    { month: 'May', users: 23 },
    { month: 'Jun', users: 25 },
  ];

  const propertyTypeData = [
    { name: 'House', value: 20 },
    { name: 'Apartment', value: 15 },
    { name: 'Condo', value: 8 },
    { name: 'PG', value: 5 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 61000 },
    { month: 'Apr', revenue: 58000 },
    { month: 'May', revenue: 70000 },
    { month: 'Jun', revenue: 75000 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your platform statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered users"
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
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="All time"
        />
        <StatsCard
          title="Payment Records"
          value={stats.totalPayments}
          icon={Receipt}
          description="Total transactions"
        />
        <StatsCard
          title="Reviews"
          value={stats.totalReviews}
          icon={MessageSquare}
          description="Total reviews"
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${Math.round((stats.activeTenants / Math.max(stats.totalTenants, 1)) * 100)}%`}
          icon={Activity}
          description="Active tenants"
        />
        <StatsCard
          title="Avg Property Price"
          value={`₹${Math.round(stats.totalRevenue / Math.max(stats.totalProperties, 1)).toLocaleString()}`}
          icon={TrendingUp}
          description="Per property"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#ff6b35" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
