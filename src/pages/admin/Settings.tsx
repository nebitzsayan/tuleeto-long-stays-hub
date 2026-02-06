import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Mail, Bell, Download, Users, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportUsersToExcel, exportPropertiesExcel, exportReviewsExcel } from "@/lib/adminExport";

interface NotificationSettings {
  newUsers: boolean;
  newProperties: boolean;
  reports: boolean;
  reviews: boolean;
}

export default function Settings() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : {
      newUsers: true,
      newProperties: true,
      reports: true,
      reviews: false,
    };
  });
  const [systemHealth, setSystemHealth] = useState<{
    status: 'healthy' | 'warning' | 'error';
    lastCheck: Date;
    details: string;
  }>({ status: 'healthy', lastCheck: new Date(), details: 'All systems operational' });

  useEffect(() => {
    fetchAdmins();
    checkSystemHealth();
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('role', 'admin');

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Simple health check - try to query the database
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const latency = Date.now() - start;
      
      if (error) {
        setSystemHealth({
          status: 'error',
          lastCheck: new Date(),
          details: `Database error: ${error.message}`,
        });
      } else if (latency > 2000) {
        setSystemHealth({
          status: 'warning',
          lastCheck: new Date(),
          details: `High latency detected (${latency}ms)`,
        });
      } else {
        setSystemHealth({
          status: 'healthy',
          lastCheck: new Date(),
          details: `All systems operational (${latency}ms latency)`,
        });
      }
    } catch (error) {
      setSystemHealth({
        status: 'error',
        lastCheck: new Date(),
        details: 'Failed to check system health',
      });
    }
  };

  const handleExport = async (type: 'users' | 'properties' | 'reviews' | 'all') => {
    setExporting(type);
    try {
      if (type === 'users' || type === 'all') {
        const { data: users } = await supabase.from('profiles').select('*');
        if (users) exportUsersToExcel(users);
      }
      if (type === 'properties' || type === 'all') {
        const { data: properties } = await supabase.from('properties').select('*');
        if (properties) exportPropertiesExcel(properties);
      }
      if (type === 'reviews' || type === 'all') {
        const { data: reviews } = await supabase.from('property_reviews').select('*, properties(title)');
        if (reviews) exportReviewsExcel(reviews);
      }
      toast.success(`${type === 'all' ? 'All data' : type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const updateNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-xs md:text-base text-muted-foreground">Manage admin panel settings and configurations</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Security Settings */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span>Security & Admins</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Current administrators with access</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {loadingAdmins ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="text-sm text-muted-foreground">No admins found</div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{admin.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{admin.profiles?.email}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Database className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <span>Data Export</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Export platform data as Excel files</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => handleExport('users')}
                disabled={!!exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'users' ? 'Exporting...' : 'Users'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => handleExport('properties')}
                disabled={!!exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'properties' ? 'Exporting...' : 'Properties'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => handleExport('reviews')}
                disabled={!!exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'reviews' ? 'Exporting...' : 'Reviews'}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-10"
                onClick={() => handleExport('all')}
                disabled={!!exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'all' ? 'Exporting...' : 'Export All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <span>Notification Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Configure which notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-users" className="text-sm cursor-pointer flex-1">New user registrations</Label>
              <Switch
                id="new-users"
                checked={notifications.newUsers}
                onCheckedChange={() => updateNotification('newUsers')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-properties" className="text-sm cursor-pointer flex-1">New property listings</Label>
              <Switch
                id="new-properties"
                checked={notifications.newProperties}
                onCheckedChange={() => updateNotification('newProperties')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reports" className="text-sm cursor-pointer flex-1">Property reports</Label>
              <Switch
                id="reports"
                checked={notifications.reports}
                onCheckedChange={() => updateNotification('reports')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reviews" className="text-sm cursor-pointer flex-1">New reviews</Label>
              <Switch
                id="reviews"
                checked={notifications.reviews}
                onCheckedChange={() => updateNotification('reviews')}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-3">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                systemHealth.status === 'healthy' ? 'bg-green-500/10' :
                systemHealth.status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
              }`}>
                <Bell className={`h-4 w-4 md:h-5 md:w-5 ${
                  systemHealth.status === 'healthy' ? 'text-green-500' :
                  systemHealth.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
              <span>System Health</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Monitor platform status</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className={`p-4 rounded-lg border ${
              systemHealth.status === 'healthy' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' :
              systemHealth.status === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900' :
              'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
            }`}>
              <div className="flex items-center gap-3">
                {systemHealth.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : systemHealth.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    systemHealth.status === 'healthy' ? 'text-green-800 dark:text-green-200' :
                    systemHealth.status === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-red-800 dark:text-red-200'
                  }`}>
                    {systemHealth.status === 'healthy' ? 'System Healthy' :
                     systemHealth.status === 'warning' ? 'Performance Warning' : 'System Error'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{systemHealth.details}</p>
                  <p className="text-xs text-muted-foreground">
                    Last checked: {systemHealth.lastCheck.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 h-10"
              onClick={checkSystemHealth}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
