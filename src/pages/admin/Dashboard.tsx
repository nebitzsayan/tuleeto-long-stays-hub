import { useState } from "react";
import { Users, Home, Shield, AlertTriangle, Activity, TrendingUp, Calendar, Zap, UserPlus, Download, Eye, CheckCircle, Clock, X, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAdminAnalytics, TimePeriod } from "@/hooks/useAdminAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

type ChartType = 'growth' | 'types' | 'activity' | null;

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, loading, period, setPeriod, propertyTypeData, growthData, refetch } = useAdminAnalytics();
  const [selectedChart, setSelectedChart] = useState<ChartType>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 md:h-32" />
          ))}
        </div>
      </div>
    );
  }

  const getChartTitle = (chartType: ChartType) => {
    switch (chartType) {
      case 'growth':
        return 'Growth Details (Last 30 Days)';
      case 'types':
        return 'Property Types Distribution';
      case 'activity':
        return 'Daily Activity Details';
      default:
        return '';
    }
  };

  const getChartSummary = (chartType: ChartType) => {
    switch (chartType) {
      case 'growth':
        const totalNewUsers = growthData.reduce((a, b) => a + (b.users || 0), 0);
        const totalNewProperties = growthData.reduce((a, b) => a + (b.properties || 0), 0);
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Total New Users (30d)</p>
              <p className="text-2xl font-bold text-primary">{totalNewUsers}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Total New Properties (30d)</p>
              <p className="text-2xl font-bold text-green-600">{totalNewProperties}</p>
            </div>
          </div>
        );
      case 'types':
        return (
          <div className="space-y-2">
            {propertyTypeData.map((type, i) => (
              <div key={type.name} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="flex items-center gap-2 text-sm">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                  />
                  {type.name}
                </span>
                <span className="font-semibold">{type.value}</span>
              </div>
            ))}
          </div>
        );
      case 'activity':
        const recentData = growthData.slice(-14);
        const avgUsers = recentData.length > 0 ? Math.round(recentData.reduce((a, b) => a + (b.users || 0), 0) / recentData.length) : 0;
        const avgProps = recentData.length > 0 ? Math.round(recentData.reduce((a, b) => a + (b.properties || 0), 0) / recentData.length) : 0;
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Avg. Daily Users</p>
              <p className="text-2xl font-bold text-primary">{avgUsers}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs">Avg. Daily Properties</p>
              <p className="text-2xl font-bold text-green-600">{avgProps}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderChartContent = (chartType: ChartType, fullSize = false) => {
    const height = fullSize ? "100%" : 200;
    
    switch (chartType) {
      case 'growth':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
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
              <Line type="monotone" dataKey="users" stroke="#ff6b35" strokeWidth={2} dot={false} name="Users" />
              <Line type="monotone" dataKey="properties" stroke="#4caf50" strokeWidth={2} dot={false} name="Properties" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'types':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={propertyTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={fullSize ? ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={fullSize ? 120 : 70}
                fill="#8884d8"
                dataKey="value"
              >
                {propertyTypeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {fullSize && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      case 'activity':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={growthData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header Section - Stacked on mobile */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Overview of your platform statistics
              <span className="block sm:inline sm:ml-1 text-muted-foreground/70">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto flex-shrink-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        {/* Period Tabs - Horizontal scroll on mobile */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="w-full">
          <div className="overflow-x-auto -mx-2 px-2 pb-1">
            <TabsList className="inline-flex w-auto min-w-full gap-0.5 h-auto p-1">
              {Object.entries(periodLabels).map(([key, label]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-2.5 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0 min-h-[36px]"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* System Health + Quick Actions Row */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* System Health Indicator */}
        <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-green-800 dark:text-green-200 truncate">System Healthy</p>
              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 truncate">All services running normally</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="font-medium text-xs sm:text-sm">Quick Actions</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-2 sm:py-2.5 px-1 sm:px-2 flex-col gap-0.5 sm:gap-1 text-xs min-h-[44px]"
                onClick={() => navigate('/admin/users')}
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-[9px] sm:text-[10px] md:text-xs truncate">Users</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-2 sm:py-2.5 px-1 sm:px-2 flex-col gap-0.5 sm:gap-1 text-xs min-h-[44px]"
                onClick={() => navigate('/admin/properties')}
              >
                <Home className="h-4 w-4" />
                <span className="text-[9px] sm:text-[10px] md:text-xs truncate">Props</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-2 sm:py-2.5 px-1 sm:px-2 flex-col gap-0.5 sm:gap-1 text-xs min-h-[44px]"
                onClick={() => navigate('/admin/reviews')}
              >
                <Eye className="h-4 w-4" />
                <span className="text-[9px] sm:text-[10px] md:text-xs truncate">Reviews</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto py-2 sm:py-2.5 px-1 sm:px-2 flex-col gap-0.5 sm:gap-1 text-xs min-h-[44px]"
                onClick={() => navigate('/admin/logs')}
              >
                <Download className="h-4 w-4" />
                <span className="text-[9px] sm:text-[10px] md:text-xs truncate">Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]" 
          onClick={() => setSelectedChart('growth')}
        >
          <CardHeader className="p-3 md:p-4 pb-2">
            <CardTitle className="text-sm md:text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="flex-1">Growth (30 Days)</span>
              <span className="text-[10px] md:text-xs text-muted-foreground font-normal">Tap to expand</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="h-[160px] md:h-[200px]">
              {renderChartContent('growth')}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]" 
          onClick={() => setSelectedChart('types')}
        >
          <CardHeader className="p-3 md:p-4 pb-2">
            <CardTitle className="text-sm md:text-lg flex items-center justify-between">
              <span>Property Types</span>
              <span className="text-[10px] md:text-xs text-muted-foreground font-normal">Tap to expand</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            {propertyTypeData.length > 0 ? (
              <div className="h-[160px] md:h-[200px]">
                {renderChartContent('types')}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[160px] md:h-[200px] text-muted-foreground text-sm">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Bar Chart */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]" 
        onClick={() => setSelectedChart('activity')}
      >
        <CardHeader className="p-3 md:p-4 pb-2">
          <CardTitle className="text-sm md:text-lg flex items-center justify-between">
            <span>Daily Activity (14 Days)</span>
            <span className="text-[10px] md:text-xs text-muted-foreground font-normal">Tap to expand</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="h-[160px] md:h-[200px]">
            {renderChartContent('activity')}
          </div>
        </CardContent>
      </Card>

      {/* Chart Detail Sheet for Mobile */}
      <Sheet open={!!selectedChart} onOpenChange={() => setSelectedChart(null)}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl px-4 pt-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <SheetTitle className="text-lg">
              {getChartTitle(selectedChart)}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedChart(null)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Full Chart */}
          <div className="h-[45vh] mb-4">
            {renderChartContent(selectedChart, true)}
          </div>
          
          {/* Summary Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Summary</h4>
            {getChartSummary(selectedChart)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
