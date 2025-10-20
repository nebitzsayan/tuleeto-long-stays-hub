import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, EyeOff, Flag, Star, Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportPropertiesExcel } from "@/lib/adminExport";

export default function PropertiesManagement() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteProperty, setDeleteProperty] = useState<any>(null);
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

  const filteredProperties = properties.filter(
    (prop) =>
      prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Property Management</h2>
          <p className="text-muted-foreground">Manage all property listings</p>
        </div>
        <Button onClick={() => exportPropertiesExcel(properties)} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
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
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.title}</TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>₹{property.price?.toLocaleString()}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {property.is_public ? (
                        <Badge variant="default">Public</Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                      {property.is_featured && <Badge>Featured</Badge>}
                      {property.is_flagged && <Badge variant="destructive">Flagged</Badge>}
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
    </div>
  );
}
