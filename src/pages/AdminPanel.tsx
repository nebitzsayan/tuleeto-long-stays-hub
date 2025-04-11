
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, Home, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PropertyListingCard from "@/components/property/PropertyListingCard";

const AdminPanel = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [adminVerified, setAdminVerified] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalImages: 0,
  });
  
  // Data for tabs
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Check if the current user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) return;
      
      if (user.email === "admin@gmail.com") {
        setAdminVerified(true);
      } else {
        toast.error("You don't have permission to access this page");
        navigate("/");
      }
      setIsAdminLoading(false);
    };

    if (!isLoading) {
      checkAdminAccess();
    }
  }, [user, isLoading, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!adminVerified) return;
      
      try {
        setLoadingData(true);
        
        // Get properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*");
        
        if (propertiesError) throw propertiesError;
        setProperties(propertiesData || []);
        
        // Get total images count (from all property images)
        let totalImagesCount = 0;
        if (propertiesData) {
          propertiesData.forEach(property => {
            if (property.images && Array.isArray(property.images)) {
              totalImagesCount += property.images.length;
            }
          });
        }
        
        // Get users
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*");
        
        if (profilesError) throw profilesError;
        setUsers(profilesData || []);
        
        // Set metrics
        setMetrics({
          totalProperties: propertiesData?.length || 0,
          totalUsers: profilesData?.length || 0,
          totalImages: totalImagesCount,
        });
      } catch (error: any) {
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } finally {
        setLoadingData(false);
      }
    };

    if (adminVerified) {
      fetchDashboardData();
    }
  }, [adminVerified]);

  // Handler for property deletion
  const handleDeleteProperty = async (id: string) => {
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      
      if (error) throw error;
      
      setProperties(prevProperties => prevProperties.filter(property => property.id !== id));
      toast.success("Property deleted successfully");
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalProperties: prev.totalProperties - 1
      }));
    } catch (error: any) {
      toast.error(`Error deleting property: ${error.message}`);
    }
  };

  if (isLoading || isAdminLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
        </div>
      </MainLayout>
    );
  }

  if (!adminVerified) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Home className="h-10 w-10 text-tuleeto-orange mr-4" />
              <div>
                <p className="text-sm font-medium">Total Properties</p>
                <h3 className="text-2xl font-bold">{metrics.totalProperties}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-10 w-10 text-tuleeto-orange mr-4" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <h3 className="text-2xl font-bold">{metrics.totalUsers}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Image className="h-10 w-10 text-tuleeto-orange mr-4" />
              <div>
                <p className="text-sm font-medium">Total Images</p>
                <h3 className="text-2xl font-bold">{metrics.totalImages}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabbed Content */}
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties">
            {loadingData ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => (
                  <PropertyListingCard 
                    key={property.id}
                    property={{
                      id: property.id,
                      title: property.title,
                      location: property.location,
                      price: property.price,
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      area: property.area,
                      image: property.images?.[0] || "/placeholder.svg",
                      type: property.type
                    }}
                    showDeleteButton={true}
                    onDelete={handleDeleteProperty}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-8">No properties found</p>
            )}
          </TabsContent>
          
          <TabsContent value="users">
            {loadingData ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.id.substring(0, 8)}...</TableCell>
                          <TableCell>{user.full_name || "N/A"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
