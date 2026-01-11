import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Mail, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-xs md:text-base text-muted-foreground">Manage admin panel settings and configurations</p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm pl-12 md:pl-[52px]">Manage admin security and access control</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-2">
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Configure security policies, manage admin roles, and review access logs.
            </p>
            <Button variant="outline" size="sm" className="w-full md:w-auto h-10">
              Manage Security
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Database className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <span>Data Management</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm pl-12 md:pl-[52px]">Backup and restore system data</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-2">
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Export all platform data, create backups, or restore from previous backups.
            </p>
            <Button variant="outline" size="sm" className="w-full md:w-auto h-10">
              Manage Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <span>Email Notifications</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm pl-12 md:pl-[52px]">Configure email notification settings</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-2">
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Manage email templates and notification preferences for users.
            </p>
            <Button variant="outline" size="sm" className="w-full md:w-auto h-10">
              Email Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-base md:text-lg">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              <span>System Alerts</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm pl-12 md:pl-[52px]">Monitor system health and alerts</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-2">
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              View system status, configure alerts, and monitor platform health.
            </p>
            <Button variant="outline" size="sm" className="w-full md:w-auto h-10">
              View Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
