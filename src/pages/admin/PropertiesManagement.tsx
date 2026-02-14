import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Eye, EyeOff, Flag, Star, Search, Download, CheckCircle, AlertTriangle, RefreshCw, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportPropertiesExcel } from "@/lib/adminExport";
import { Pagination } from "@/components/admin/Pagination";
import { BulkActions, commonBulkActions } from "@/components/admin/BulkActions";
import { getThumbUrl } from "@/lib/imagekitUrl";
import { PROPERTIES_QUERY_KEY, FEATURED_PROPERTIES_QUERY_KEY, PROPERTY_REVIEWS_QUERY_KEY } from "@/hooks/useProperties";

type FilterTab = "all" | "reported" | "public" | "private";
type SortOption = "newest" | "oldest" | "price_high" | "price_low" | "reports";

const ITEMS_PER_PAGE = 15;

export default function PropertiesManagement() {
  const queryClient = useQueryClient();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteProperty, setDeleteProperty] = useState<any>(null);
  const [verifyProperty, setVerifyProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkVisibilityConfirm, setBulkVisibilityConfirm] = useState<"public" | "private" | null>(null);
  const navigate = useNavigate();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: FEATURED_PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PROPERTY_REVIEWS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

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
      invalidateQueries();
      fetchProperties();
      setDeleteProperty(null);
    } catch (error: any) {
      toast.error("Failed to delete property");
    }
  };

  const handleVerifyProperty = async (propertyId: string) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: "property_verified",
        _target_id: propertyId,
        _target_type: "property",
      });

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

      const { error: deleteError } = await supabase
        .from("property_reports")
        .delete()
        .eq("property_id", propertyId);

      if (deleteError) console.error("Failed to delete reports:", deleteError);

      toast.success("Property verified and published successfully");
      invalidateQueries();
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
      invalidateQueries();
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
      invalidateQueries();
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
      invalidateQueries();
      fetchProperties();
    } catch (error: any) {
      toast.error("Failed to update property");
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      for (const propertyId of selectedProperties) {
        await supabase.rpc("log_admin_action", {
          _action_type: "property_deleted",
          _target_id: propertyId,
          _target_type: "property",
        });
        await supabase.from("properties").delete().eq("id", propertyId);
      }
      toast.success(`${selectedProperties.size} properties deleted`);
      invalidateQueries();
      setSelectedProperties(new Set());
      fetchProperties();
    } catch (error) {
      toast.error("Bulk delete failed");
    }
    setBulkDeleteConfirm(false);
  };

  const handleBulkVisibility = async (isPublic: boolean) => {
    try {
      for (const propertyId of selectedProperties) {
        await supabase.rpc("log_admin_action", {
          _action_type: isPublic ? "property_made_public" : "property_made_private",
          _target_id: propertyId,
          _target_type: "property",
        });
        await supabase.from("properties").update({ is_public: isPublic }).eq("id", propertyId);
      }
      toast.success(`${selectedProperties.size} properties made ${isPublic ? 'public' : 'private'}`);
      invalidateQueries();
      setSelectedProperties(new Set());
      fetchProperties();
    } catch (error) {
      toast.error("Bulk update failed");
    }
    setBulkVisibilityConfirm(null);
  };

  const togglePropertySelection = (propertyId: string) => {
    const newSelection = new Set(selectedProperties);
    if (newSelection.has(propertyId)) {
      newSelection.delete(propertyId);
    } else {
      newSelection.add(propertyId);
    }
    setSelectedProperties(newSelection);
  };

  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter((prop) => {
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

    // Apply sorting
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "price_high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "price_low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "reports":
        result.sort((a, b) => (b.report_count || 0) - (a.report_count || 0));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [properties, searchTerm, activeTab, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedProperties, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, sortBy]);

  const selectAllOnPage = () => {
    const newSelection = new Set(selectedProperties);
    paginatedProperties.forEach(prop => newSelection.add(prop.id));
    setSelectedProperties(newSelection);
  };

  const isAllPageSelected = paginatedProperties.every(prop => selectedProperties.has(prop.id));
  const reportedCount = properties.filter(p => (p.report_count && p.report_count > 0) || p.is_flagged).length;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-3xl font-bold tracking-tight">Property Management</h2>
            <p className="text-[10px] sm:text-xs md:text-base text-muted-foreground">
              {filteredAndSortedProperties.length} properties
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={fetchProperties} variant="outline" size="sm" className="h-9 sm:h-10 w-9 sm:w-auto p-0 sm:px-3">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => exportPropertiesExcel(properties)} variant="outline" size="sm" className="h-9 sm:h-10 flex-1 sm:flex-none">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="w-auto inline-flex gap-0.5">
              <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 min-h-[36px]">
                All ({properties.length})
              </TabsTrigger>
              <TabsTrigger value="reported" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 relative min-h-[36px]">
                Reported
                {reportedCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
                    {reportedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="public" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 min-h-[36px]">
                Public
              </TabsTrigger>
              <TabsTrigger value="private" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 min-h-[36px]">
                Private
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 sm:h-10 text-sm"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="price_high">Price: High</SelectItem>
              <SelectItem value="price_low">Price: Low</SelectItem>
              <SelectItem value="reports">Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedProperties.size}
        totalCount={paginatedProperties.length}
        onSelectAll={selectAllOnPage}
        onClearSelection={() => setSelectedProperties(new Set())}
        isAllSelected={isAllPageSelected && paginatedProperties.length > 0}
        actions={[
          commonBulkActions.makePublic(() => setBulkVisibilityConfirm("public")),
          commonBulkActions.makePrivate(() => setBulkVisibilityConfirm("private")),
          commonBulkActions.delete(() => setBulkDeleteConfirm(true)),
        ]}
      />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : paginatedProperties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No properties found</div>
        ) : (
          paginatedProperties.map((property) => (
            <Card key={property.id} className={`${property.report_count > 0 ? "border-destructive" : ""} ${selectedProperties.has(property.id) ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedProperties.has(property.id)}
                    onCheckedChange={() => togglePropertySelection(property.id)}
                    className="mt-1"
                  />
                  {/* Thumbnail */}
                  {property.images?.[0] && (
                    <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={getThumbUrl(property.images[0])} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">{property.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{property.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-primary">₹{property.price?.toLocaleString()}/mo</p>
                      {property.images?.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <ImageIcon className="h-3 w-3" />
                          {property.images.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
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
                      {property.report_count}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="text-xs h-11"
                  >
                    View
                  </Button>
                  
                  {(property.report_count > 0 || property.is_flagged) ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setVerifyProperty(property)}
                      className="text-xs h-11 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verify
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(property.id, !property.is_public)}
                      className="text-xs h-11"
                    >
                      {property.is_public ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                      {property.is_public ? "Hide" : "Show"}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant={property.is_featured ? "default" : "outline"}
                    onClick={() => handleToggleFeatured(property.id, !property.is_featured)}
                    className="text-xs h-11"
                  >
                    <Star className="h-3.5 w-3.5 mr-1" />
                    {property.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteProperty(property)}
                    className="text-xs h-11"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
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
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllPageSelected && paginatedProperties.length > 0}
                  onCheckedChange={() => isAllPageSelected ? setSelectedProperties(new Set()) : selectAllOnPage()}
                />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
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
                <TableCell colSpan={8} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : paginatedProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">No properties found</TableCell>
              </TableRow>
            ) : (
              paginatedProperties.map((property) => (
                <TableRow key={property.id} className={`${property.report_count > 0 ? "bg-destructive/5" : ""} ${selectedProperties.has(property.id) ? 'bg-primary/5' : ''}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProperties.has(property.id)}
                      onCheckedChange={() => togglePropertySelection(property.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {property.images?.[0] ? (
                      <div className="w-16 h-12 rounded-md overflow-hidden bg-muted relative">
                        <img 
                          src={getThumbUrl(property.images[0])} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                        {property.images.length > 1 && (
                          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                            +{property.images.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredAndSortedProperties.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-lg">Delete Property?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete <strong>{deleteProperty?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteProperty(deleteProperty?.id)}
              className="w-full sm:w-auto h-11 bg-destructive hover:bg-destructive/90"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Dialog */}
      <AlertDialog open={!!verifyProperty} onOpenChange={() => setVerifyProperty(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <AlertDialogTitle className="text-lg">Verify Property?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              This will clear all reports and flags, and make <strong>{verifyProperty?.title}</strong> public.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleVerifyProperty(verifyProperty?.id)}
              className="w-full sm:w-auto h-11 bg-green-600 hover:bg-green-700"
            >
              Verify & Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProperties.size} Properties?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected properties. This cannot be undone.
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

      {/* Bulk Visibility Dialog */}
      <AlertDialog open={!!bulkVisibilityConfirm} onOpenChange={() => setBulkVisibilityConfirm(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Make {selectedProperties.size} Properties {bulkVisibilityConfirm === "public" ? "Public" : "Private"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the visibility of all selected properties.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleBulkVisibility(bulkVisibilityConfirm === "public")}
              className="w-full sm:w-auto"
            >
              Update All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
