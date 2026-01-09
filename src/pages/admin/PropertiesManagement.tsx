import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Eye, EyeOff, Flag, Star, Search, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportPropertiesExcel } from "@/lib/adminExport";

type FilterTab = "all" | "reported" | "public" | "private";

export default function PropertiesManagement() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteProperty, setDeleteProperty] = useState<any>(null);
  const [verifyProperty, setVerifyProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const navigate = useNavigate();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: "property_deleted",
        _target_id: propertyId,
        _target_type: "property",
      });

      const { error } = await supabase.from("properties").delete().eq("id", propertyId);
      if (error) throw error;

      toast.success("Property deleted successfully");
      fetchProperties();
      setDeleteProperty(null);
    } catch (error: any) {
      toast.error("Failed to delete property");
    }
  };

  const handleVerifyProperty = async (propertyId: string) => {
    try {
      // Log admin action
      await supabase.rpc("log_admin_action", {
        _action_type: "property_verified",
        _target_id: propertyId,
        _target_type: "property",
      });

      // Update property - make public, unflag, reset report count
      const { error: updateError } = await supabase
        .from("properties")
        .update({ 
          is_public: true, 
          is_flagged: false, 
          flag_reason: null,
          report_count: 0
        })
        .eq("id", propertyId);

      if (updateError) throw updateError;

      // Delete all reports for this property
      const { error: deleteError } = await supabase
        .from("property_reports")
        .delete()
        .eq("property_id", propertyId);

      if (deleteError) console.error("Failed to delete reports:", deleteError);

      toast.success("Property verified and published successfully");
      fetchProperties();
      setVerifyProperty(null);
    } catch (error: any) {
      toast.error("Failed to verify property");
    }
  };

  const handleToggleVisibility = async (propertyId: string, isPublic: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isPublic ? "property_made_public" : "property_made_private",
        _target_id: propertyId,
        _target_type: "property",
      });

      const { error } = await supabase
        .from("properties")
        .update({ is_public: isPublic })
        .eq("id", propertyId);

      if (error) throw error;
      toast.success(`Property ${isPublic ? "published" : "unpublished"}`);
      fetchProperties();
    } catch (error: any) {
      toast.error("Failed to update property");
    }
  };

  const handleToggleFeatured = async (propertyId: string, isFeatured: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isFeatured ? "property_featured" : "property_unfeatured",
        _target_id: propertyId,
        _target_type: "property",
      });

      const { error } = await supabase
        .from("properties")
        .update({ is_featured: isFeatured })
        .eq("id", propertyId);

      if (error) throw error;
      toast.success(`Property ${isFeatured ? "featured" : "unfeatured"}`);
      fetchProperties();
    } catch (error: any) {
      toast.error("Failed to update property");
    }
  };

  const handleToggleFlagged = async (propertyId: string, isFlagged: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isFlagged ? "property_flagged" : "property_unflagged",
        _target_id: propertyId,
        _target_type: "property",
      });

      const { error } = await supabase
        .from("properties")
        .update({ is_flagged: isFlagged, flag_reason: isFlagged ? "Flagged by admin" : null })
        .eq("id", propertyId);

      if (error) throw error;
      toast.success(`Property ${isFlagged ? "flagged" : "unflagged"}`);
      fetchProperties();
    } catch (error: any) {
      toast.error("Failed to update property");
    }
  };

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch = 
      prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (activeTab) {
      case "reported":
        return matchesSearch && ((prop.report_count && prop.report_count > 0) || prop.is_flagged);
      case "public":
        return matchesSearch && prop.is_public;
      case "private":
        return matchesSearch && !prop.is_public;
      default:
        return matchesSearch;
    }
  });

  const reportedCount = properties.filter(p => (p.report_count && p.report_count > 0) || p.is_flagged).length;

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Property Management</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage all property listings</p>
        </div>
        <Button onClick={() => exportPropertiesExcel(properties)} variant="outline" size="sm" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:flex">
          <TabsTrigger value="all" className="text-xs md:text-sm">
            All ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="reported" className="text-xs md:text-sm relative">
            Reported
            {reportedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {reportedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="public" className="text-xs md:text-sm">
            Public
          </TabsTrigger>
          <TabsTrigger value="private" className="text-xs md:text-sm">
            Private
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No properties found</div>
        ) : (
          filteredProperties.map((property) => (
            <Card key={property.id} className={property.report_count > 0 ? "border-destructive" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">{property.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{property.location}</p>
                    <p className="text-sm font-semibold mt-1">₹{property.price?.toLocaleString()}/mo</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-3">
                  {property.is_public ? (
                    <Badge variant="default" className="text-xs">Public</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Private</Badge>
                  )}
                  {property.is_featured && <Badge className="text-xs">Featured</Badge>}
                  {property.is_flagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                  {property.report_count > 0 && (
                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {property.report_count} Reports
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="text-xs h-8"
                  >
                    View
                  </Button>
                  
                  {(property.report_count > 0 || property.is_flagged) && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setVerifyProperty(property)}
                      className="text-xs h-8 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verify
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVisibility(property.id, !property.is_public)}
                    className="h-8 w-8 p-0"
                  >
                    {property.is_public ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={property.is_featured ? "default" : "outline"}
                    onClick={() => handleToggleFeatured(property.id, !property.is_featured)}
                    className="h-8 w-8 p-0"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteProperty(property)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No properties found</TableCell>
              </TableRow>
            ) : (
              filteredProperties.map((property) => (
                <TableRow key={property.id} className={property.report_count > 0 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{property.title}</TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>₹{property.price?.toLocaleString()}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {property.is_public ? (
                        <Badge variant="default">Public</Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                      {property.is_featured && <Badge>Featured</Badge>}
                      {property.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                      {property.report_count > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {property.report_count}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/property/${property.id}`)}
                      >
                        View
                      </Button>
                      
                      {(property.report_count > 0 || property.is_flagged) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setVerifyProperty(property)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVisibility(property.id, !property.is_public)}
                      >
                        {property.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant={property.is_featured ? "default" : "outline"}
                        onClick={() => handleToggleFeatured(property.id, !property.is_featured)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={property.is_flagged ? "destructive" : "outline"}
                        onClick={() => handleToggleFlagged(property.id, !property.is_flagged)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteProperty(property)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteProperty?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteProperty(deleteProperty?.id)}>
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Dialog */}
      <AlertDialog open={!!verifyProperty} onOpenChange={() => setVerifyProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify & Publish Property</AlertDialogTitle>
            <AlertDialogDescription>
              This will verify <strong>{verifyProperty?.title}</strong>, make it public, clear all reports ({verifyProperty?.report_count || 0}), and remove the flagged status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleVerifyProperty(verifyProperty?.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Verify & Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
