
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Home, Users, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalImages: 0,
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (user.email === "admin@gmail.com") {
        setIsAdmin(true);
        await fetchAdminData();
      } else {
        toast.error("You do not have permission to access this page");
        navigate("/");
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*");

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Calculate total images
      let totalImages = 0;
      if (propertiesData) {
        propertiesData.forEach((property) => {
          if (property.images && Array.isArray(property.images)) {
            totalImages += property.images.length;
          }
        });
      }

      // Update stats
      setStats({
        totalProperties: propertiesData?.length || 0,
        totalUsers: usersData?.length || 0,
        totalImages: totalImages,
      });
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      toast.error(`Error loading dashboard data: ${error.message}`);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;

      setProperties(properties.filter((property) => property.id !== id));
      setStats((prevStats) => ({
        ...prevStats,
        totalProperties: prevStats.totalProperties - 1,
      }));

      toast.success("Property deleted successfully");
    } catch (error: any) {
      console.error("Error deleting property:", error);
      toast.error(`Error deleting property: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Home className="mr-2 h-5 w-5 text-tuleeto-orange" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalProperties}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Users className="mr-2 h-5 w-5 text-tuleeto-orange" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Image className="mr-2 h-5 w-5 text-tuleeto-orange" />
                Total Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalImages}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties">
          <TabsList className="mb-4">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Property Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No properties found
                          </TableCell>
                        </TableRow>
                      ) : (
                        properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>{property.title}</TableCell>
                            <TableCell>₹{property.price.toLocaleString()}</TableCell>
                            <TableCell>{property.type}</TableCell>
                            <TableCell>{property.owner_id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              {new Date(property.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingPropertyId(property.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id.substring(0, 8)}...</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.full_name || "Not provided"}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPropertyId}
        onOpenChange={(isOpen) => !isOpen && setDeletingPropertyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPropertyId && handleDeleteProperty(deletingPropertyId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default AdminPanel;
