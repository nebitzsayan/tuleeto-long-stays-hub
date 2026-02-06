import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Ban, Search, Download, ChevronDown, ChevronUp, Home, Users, RefreshCw } from "lucide-react";
import { exportUsersToExcel } from "@/lib/adminExport";
import { Pagination } from "@/components/admin/Pagination";
import { BulkActions, commonBulkActions } from "@/components/admin/BulkActions";

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

const ITEMS_PER_PAGE = 15;

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUser, setDeleteUser] = useState<UserWithDetails | null>(null);
  const [banUser, setBanUser] = useState<UserWithDetails | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkBanConfirm, setBulkBanConfirm] = useState(false);

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

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      for (const userId of selectedUsers) {
        await supabase.rpc("log_admin_action", {
          _action_type: "user_deleted",
          _target_id: userId,
          _target_type: "user",
        });
        await supabase.from("profiles").delete().eq("id", userId);
      }
      toast.success(`${selectedUsers.size} users deleted`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      toast.error("Bulk delete failed");
    }
    setBulkDeleteConfirm(false);
  };

  const handleBulkBan = async () => {
    try {
      for (const userId of selectedUsers) {
        await supabase.rpc("log_admin_action", {
          _action_type: "user_banned",
          _target_id: userId,
          _target_type: "user",
        });
        await supabase.from("profiles").update({ is_banned: true, ban_reason: "Bulk banned by admin" }).eq("id", userId);
      }
      toast.success(`${selectedUsers.size} users banned`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      toast.error("Bulk ban failed");
    }
    setBulkBanConfirm(false);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const selectAllOnPage = () => {
    const newSelection = new Set(selectedUsers);
    paginatedUsers.forEach(user => newSelection.add(user.id));
    setSelectedUsers(newSelection);
  };

  const isAllPageSelected = paginatedUsers.every(user => selectedUsers.has(user.id));

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-xs md:text-base text-muted-foreground">
            {filteredUsers.length} users {searchTerm && `matching "${searchTerm}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm" className="h-10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => exportUsersToExcel(users)} variant="outline" size="sm" className="flex-1 md:flex-none h-10">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
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

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedUsers.size}
        totalCount={paginatedUsers.length}
        onSelectAll={selectAllOnPage}
        onClearSelection={() => setSelectedUsers(new Set())}
        isAllSelected={isAllPageSelected && paginatedUsers.length > 0}
        actions={[
          commonBulkActions.ban(() => setBulkBanConfirm(true)),
          commonBulkActions.delete(() => setBulkDeleteConfirm(true)),
        ]}
      />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        ) : (
          paginatedUsers.map((user) => (
            <Card key={user.id} className={selectedUsers.has(user.id) ? "ring-2 ring-primary" : ""}>
              <Collapsible open={expandedUser === user.id} onOpenChange={() => handleExpandUser(user.id)}>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="mt-1"
                    />
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
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllPageSelected && paginatedUsers.length > 0}
                  onCheckedChange={() => isAllPageSelected ? setSelectedUsers(new Set()) : selectAllOnPage()}
                />
              </TableHead>
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
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No users found</TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <>
                  <TableRow 
                    key={user.id} 
                    className={`cursor-pointer ${selectedUsers.has(user.id) ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleExpandUser(user.id)}>
                      {expandedUser === user.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => handleExpandUser(user.id)}>{user.email}</TableCell>
                    <TableCell onClick={() => handleExpandUser(user.id)}>{user.full_name || "N/A"}</TableCell>
                    <TableCell onClick={() => handleExpandUser(user.id)}>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell onClick={() => handleExpandUser(user.id)}>
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
                      <TableCell colSpan={7} className="bg-muted/50">
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Delete Dialog */}
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

      {/* Ban Dialog */}
      <AlertDialog open={!!banUser} onOpenChange={() => setBanUser(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-lg">
              {banUser?.is_banned ? "Unban" : "Ban"} User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {banUser?.is_banned 
                ? `This will allow ${banUser?.email} to access the platform again.`
                : `This will prevent ${banUser?.email} from accessing the platform.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => banUser && handleBanUser(banUser.id, !banUser.is_banned)}
              className={`w-full sm:w-auto h-11 ${banUser?.is_banned ? '' : 'bg-destructive hover:bg-destructive/90'}`}
            >
              {banUser?.is_banned ? "Unban User" : "Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedUsers.size} Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected users and their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Ban Dialog */}
      <AlertDialog open={bulkBanConfirm} onOpenChange={setBulkBanConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {selectedUsers.size} Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will ban all selected users from accessing the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkBan} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">
              Ban All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
