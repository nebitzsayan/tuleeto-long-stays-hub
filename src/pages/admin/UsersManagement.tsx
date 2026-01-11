import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Ban, Search, Download, ChevronDown, ChevronUp, Home, Users } from "lucide-react";
import { exportUsersToExcel } from "@/lib/adminExport";

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_banned: boolean | null;
  ban_reason: string | null;
  properties?: any[];
  tenantHistory?: any[];
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUser, setDeleteUser] = useState<UserWithDetails | null>(null);
  const [banUser, setBanUser] = useState<UserWithDetails | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        supabase.from("properties").select("id, title, location, price, is_public, created_at").eq("owner_id", userId),
        supabase.from("tenants").select("id, name, property_id, move_in_date, move_out_date, is_active, monthly_rent"),
      ]);

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, properties: propertiesRes.data || [], tenantHistory: tenantsRes.data || [] }
          : u
      ));
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExpandUser = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      const user = users.find(u => u.id === userId);
      if (!user?.properties) {
        fetchUserDetails(userId);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: "user_deleted",
        _target_id: userId,
        _target_type: "user",
      });

      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
      setDeleteUser(null);
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isBanned ? "user_banned" : "user_unbanned",
        _target_id: userId,
        _target_type: "user",
      });

      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: isBanned, ban_reason: isBanned ? "Banned by admin" : null })
        .eq("id", userId);

      if (error) throw error;
      toast.success(`User ${isBanned ? "banned" : "unbanned"} successfully`);
      fetchUsers();
      setBanUser(null);
    } catch (error: any) {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-xs md:text-base text-muted-foreground">Manage all users on the platform</p>
        </div>
        <Button onClick={() => exportUsersToExcel(users)} variant="outline" size="sm" className="w-full md:w-auto h-10">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <Collapsible open={expandedUser === user.id} onOpenChange={() => handleExpandUser(user.id)}>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">{user.email}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{user.full_name || "No name"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {user.is_banned ? (
                        <Badge variant="destructive" className="text-xs">Banned</Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs h-9 px-2">
                        {expandedUser === user.id ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Details
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={user.is_banned ? "default" : "destructive"}
                        onClick={() => setBanUser(user)}
                        className="h-9 w-9 p-0"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteUser(user)}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent className="mt-4 space-y-4">
                    {/* User's Properties */}
                    <div>
                      <h4 className="text-xs font-semibold flex items-center gap-1 mb-2">
                        <Home className="h-3 w-3" /> Listed Properties
                      </h4>
                      {user.properties?.length ? (
                        <div className="space-y-2">
                          {user.properties.map((prop: any) => (
                            <div key={prop.id} className="bg-muted p-2.5 rounded-lg text-xs">
                              <p className="font-medium truncate">{prop.title}</p>
                              <p className="text-muted-foreground">{prop.location} • ₹{prop.price?.toLocaleString()}</p>
                              <Badge variant={prop.is_public ? "default" : "secondary"} className="mt-1.5 text-xs">
                                {prop.is_public ? "Public" : "Private"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No properties listed</p>
                      )}
                    </div>
                    
                    {/* Tenant History */}
                    <div>
                      <h4 className="text-xs font-semibold flex items-center gap-1 mb-2">
                        <Users className="h-3 w-3" /> Tenants Managed
                      </h4>
                      {user.tenantHistory?.length ? (
                        <div className="space-y-2">
                          {user.tenantHistory.slice(0, 3).map((tenant: any) => (
                            <div key={tenant.id} className="bg-muted p-2.5 rounded-lg text-xs">
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-muted-foreground">₹{tenant.monthly_rent?.toLocaleString()}/month</p>
                              <Badge variant={tenant.is_active ? "default" : "secondary"} className="mt-1.5 text-xs">
                                {tenant.is_active ? "Active" : "Moved Out"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No tenants found</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No users found</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <>
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => handleExpandUser(user.id)}>
                    <TableCell>
                      {expandedUser === user.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || "N/A"}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={user.is_banned ? "default" : "destructive"}
                          onClick={() => setBanUser(user)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedUser === user.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/50">
                        <div className="p-4 grid md:grid-cols-2 gap-6">
                          {/* Properties */}
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Home className="h-4 w-4" /> Listed Properties ({user.properties?.length || 0})
                            </h4>
                            {user.properties?.length ? (
                              <div className="space-y-2">
                                {user.properties.map((prop: any) => (
                                  <div key={prop.id} className="bg-background p-3 rounded-md border">
                                    <p className="font-medium">{prop.title}</p>
                                    <p className="text-sm text-muted-foreground">{prop.location} • ₹{prop.price?.toLocaleString()}/mo</p>
                                    <Badge variant={prop.is_public ? "default" : "secondary"} className="mt-2">
                                      {prop.is_public ? "Public" : "Private"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No properties listed</p>
                            )}
                          </div>
                          
                          {/* Tenants */}
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Users className="h-4 w-4" /> Tenants Managed
                            </h4>
                            {user.tenantHistory?.length ? (
                              <div className="space-y-2">
                                {user.tenantHistory.map((tenant: any) => (
                                  <div key={tenant.id} className="bg-background p-3 rounded-md border">
                                    <p className="font-medium">{tenant.name}</p>
                                    <p className="text-sm text-muted-foreground">₹{tenant.monthly_rent?.toLocaleString()}/month</p>
                                    <Badge variant={tenant.is_active ? "default" : "secondary"} className="mt-2">
                                      {tenant.is_active ? "Active" : "Moved Out"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No tenants found</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog - Mobile Optimized */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-lg">Delete User?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete <strong>{deleteUser?.email}</strong> and all their data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteUser && handleDeleteUser(deleteUser.id)}
              className="w-full sm:w-auto h-11 bg-destructive hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Dialog - Mobile Optimized */}
      <AlertDialog open={!!banUser} onOpenChange={() => setBanUser(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${banUser?.is_banned ? 'bg-green-100' : 'bg-destructive/10'}`}>
                <Ban className={`h-5 w-5 ${banUser?.is_banned ? 'text-green-600' : 'text-destructive'}`} />
              </div>
              <AlertDialogTitle className="text-lg">
                {banUser?.is_banned ? "Unban User?" : "Ban User?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              {banUser?.is_banned
                ? `This will unban ${banUser?.email} and restore their access.`
                : `This will ban ${banUser?.email} from the platform. They will not be able to access their account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => banUser && handleBanUser(banUser.id, !banUser.is_banned)}
              className={`w-full sm:w-auto h-11 ${banUser?.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}`}
            >
              {banUser?.is_banned ? "Unban User" : "Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
