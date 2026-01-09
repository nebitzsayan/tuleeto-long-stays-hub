import { LayoutDashboard, Users, Home, Receipt, MessageSquare, Settings, FileText, Shield, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Properties", url: "/admin/properties", icon: Home },
  { title: "Tenants", url: "/admin/tenants", icon: Shield },
  { title: "Payments", url: "/admin/payments", icon: Receipt },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Audit Logs", url: "/admin/logs", icon: FileText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted"
                      }
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminMobileHeader() {
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
      <span className="font-bold text-lg">Admin Panel</span>
      <SidebarTrigger>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SidebarTrigger>
    </div>
  );
}
