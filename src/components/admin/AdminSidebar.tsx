import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Home, MessageSquare, Settings, FileText, Shield, Menu, AlertTriangle, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function AdminSidebar() {
  const { isMobile, setOpenMobile, openMobile } = useSidebar();
  const [reportedCount, setReportedCount] = useState(0);

  useEffect(() => {
    const fetchReportedCount = async () => {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .gt("report_count", 0);
      setReportedCount(count || 0);
    };
    fetchReportedCount();
  }, []);

  const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Properties", url: "/admin/properties", icon: Home, badge: reportedCount > 0 ? reportedCount : undefined },
    { title: "Tenants", url: "/admin/tenants", icon: Shield },
    { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
    { title: "Audit Logs", url: "/admin/logs", icon: FileText },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && openMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}
      
      <Sidebar className="border-r z-50" collapsible="icon">
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Admin Panel</span>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:hidden"
                onClick={() => setOpenMobile(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={({ isActive }) =>
                          `relative flex items-center gap-2 ${isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-muted"}`
                        }
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 min-w-5 px-1.5 text-xs font-medium group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:text-[10px]"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}

export function AdminMobileHeader() {
  const [reportedCount, setReportedCount] = useState(0);

  useEffect(() => {
    const fetchReportedCount = async () => {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .gt("report_count", 0);
      setReportedCount(count || 0);
    };
    fetchReportedCount();
  }, []);

  return (
    <div className="md:hidden flex items-center justify-between p-3 border-b bg-background sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">Admin Panel</span>
        {reportedCount > 0 && (
          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            {reportedCount}
          </Badge>
        )}
      </div>
      <SidebarTrigger className="h-10 w-10" />
    </div>
  );
}
