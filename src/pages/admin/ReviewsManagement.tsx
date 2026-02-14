import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Flag, Search, Download, Star, MessageSquare, RefreshCw, CheckCircle } from "lucide-react";
import { exportReviewsExcel } from "@/lib/adminExport";
import { Pagination } from "@/components/admin/Pagination";
import { BulkActions, commonBulkActions } from "@/components/admin/BulkActions";
import { PROPERTIES_QUERY_KEY, FEATURED_PROPERTIES_QUERY_KEY, PROPERTY_REVIEWS_QUERY_KEY } from "@/hooks/useProperties";

type FilterTab = "all" | "pending" | "approved" | "flagged";

const ITEMS_PER_PAGE = 15;

export default function ReviewsManagement() {
  const queryClient = useQueryClient();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteReview, setDeleteReview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: FEATURED_PROPERTIES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PROPERTY_REVIEWS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_reviews")
        .select(`
          *,
          properties (
            title,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: "review_deleted",
        _target_id: reviewId,
        _target_type: "review",
      });

      const { error } = await supabase.from("property_reviews").delete().eq("id", reviewId);
      if (error) throw error;

      toast.success("Review deleted successfully");
      invalidateQueries();
      fetchReviews();
      setDeleteReview(null);
    } catch (error: any) {
      toast.error("Failed to delete review");
    }
  };

  const handleToggleFlagged = async (reviewId: string, isFlagged: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isFlagged ? "review_flagged" : "review_unflagged",
        _target_id: reviewId,
        _target_type: "review",
      });

      const { error } = await supabase
        .from("property_reviews")
        .update({ is_flagged: isFlagged, flag_reason: isFlagged ? "Flagged by admin" : null })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success(`Review ${isFlagged ? "flagged" : "unflagged"}`);
      invalidateQueries();
      fetchReviews();
    } catch (error: any) {
      toast.error("Failed to update review");
    }
  };

  const handleToggleApproved = async (reviewId: string, isApproved: boolean) => {
    try {
      await supabase.rpc("log_admin_action", {
        _action_type: isApproved ? "review_approved" : "review_rejected",
        _target_id: reviewId,
        _target_type: "review",
      });

      const { error } = await supabase
        .from("property_reviews")
        .update({ is_approved: isApproved })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success(`Review ${isApproved ? "approved" : "rejected"}`);
      invalidateQueries();
      fetchReviews();
    } catch (error: any) {
      toast.error("Failed to update review");
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      for (const reviewId of selectedReviews) {
        await supabase.rpc("log_admin_action", {
          _action_type: "review_deleted",
          _target_id: reviewId,
          _target_type: "review",
        });
        await supabase.from("property_reviews").delete().eq("id", reviewId);
      }
      toast.success(`${selectedReviews.size} reviews deleted`);
      invalidateQueries();
      setSelectedReviews(new Set());
      fetchReviews();
    } catch (error) {
      toast.error("Bulk delete failed");
    }
    setBulkDeleteConfirm(false);
  };

  const handleBulkApprove = async () => {
    try {
      for (const reviewId of selectedReviews) {
        await supabase.rpc("log_admin_action", {
          _action_type: "review_approved",
          _target_id: reviewId,
          _target_type: "review",
        });
        await supabase.from("property_reviews").update({ is_approved: true }).eq("id", reviewId);
      }
      toast.success(`${selectedReviews.size} reviews approved`);
      invalidateQueries();
      setSelectedReviews(new Set());
      fetchReviews();
    } catch (error) {
      toast.error("Bulk approve failed");
    }
    setBulkApproveConfirm(false);
  };

  const toggleReviewSelection = (reviewId: string) => {
    const newSelection = new Set(selectedReviews);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setSelectedReviews(newSelection);
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch = 
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = ratingFilter === null || review.rating === ratingFilter;
      
      let matchesTab = true;
      switch (activeTab) {
        case "pending":
          matchesTab = !review.is_approved;
          break;
        case "approved":
          matchesTab = review.is_approved;
          break;
        case "flagged":
          matchesTab = review.is_flagged;
          break;
      }
      
      return matchesSearch && matchesRating && matchesTab;
    });
  }, [reviews, searchTerm, activeTab, ratingFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, ratingFilter]);

  const selectAllOnPage = () => {
    const newSelection = new Set(selectedReviews);
    paginatedReviews.forEach(review => newSelection.add(review.id));
    setSelectedReviews(newSelection);
  };

  const isAllPageSelected = paginatedReviews.every(review => selectedReviews.has(review.id));
  const pendingCount = reviews.filter(r => !r.is_approved).length;
  const flaggedCount = reviews.filter(r => r.is_flagged).length;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-3xl font-bold tracking-tight">Review Management</h2>
            <p className="text-[10px] sm:text-xs md:text-base text-muted-foreground">
              {filteredReviews.length} reviews
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={fetchReviews} variant="outline" size="sm" className="h-9 sm:h-10 w-9 sm:w-auto p-0 sm:px-3">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => exportReviewsExcel(reviews)} variant="outline" size="sm" className="h-9 sm:h-10 flex-1 sm:flex-none">
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
                All ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 relative min-h-[36px]">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 min-h-[36px]">
                Approved
              </TabsTrigger>
              <TabsTrigger value="flagged" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 relative min-h-[36px]">
                Flagged
                {flaggedCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
                    {flaggedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 sm:h-10 text-sm"
            />
          </div>
          {/* Rating Filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={ratingFilter === rating ? "default" : "outline"}
                size="sm"
                className="h-9 sm:h-10 w-9 sm:w-10 p-0 flex-shrink-0"
                onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
              >
                {rating}★
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedReviews.size}
        totalCount={paginatedReviews.length}
        onSelectAll={selectAllOnPage}
        onClearSelection={() => setSelectedReviews(new Set())}
        isAllSelected={isAllPageSelected && paginatedReviews.length > 0}
        actions={[
          commonBulkActions.approve(() => setBulkApproveConfirm(true)),
          commonBulkActions.delete(() => setBulkDeleteConfirm(true)),
        ]}
      />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : paginatedReviews.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No reviews found
            </CardContent>
          </Card>
        ) : (
          paginatedReviews.map((review) => (
            <Card key={review.id} className={selectedReviews.has(review.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedReviews.has(review.id)}
                    onCheckedChange={() => toggleReviewSelection(review.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{review.properties?.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{review.properties?.location}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold text-sm">{review.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 mt-2">
                      {review.is_approved ? (
                        <Badge variant="default" className="text-xs">Approved</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                      {review.is_flagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                    </div>

                    {review.comment && (
                      <div className="mt-3 flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={review.is_approved ? "secondary" : "default"}
                        onClick={() => handleToggleApproved(review.id, !review.is_approved)}
                        className="h-11 text-xs"
                      >
                        {review.is_approved ? "Reject" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant={review.is_flagged ? "destructive" : "outline"}
                        onClick={() => handleToggleFlagged(review.id, !review.is_flagged)}
                        className="h-11 text-xs"
                      >
                        <Flag className="h-3.5 w-3.5 mr-1" />
                        Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteReview(review)}
                        className="h-11 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
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
                  checked={isAllPageSelected && paginatedReviews.length > 0}
                  onCheckedChange={() => isAllPageSelected ? setSelectedReviews(new Set()) : selectAllOnPage()}
                />
              </TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : paginatedReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No reviews found</TableCell>
              </TableRow>
            ) : (
              paginatedReviews.map((review) => (
                <TableRow key={review.id} className={selectedReviews.has(review.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReviews.has(review.id)}
                      onCheckedChange={() => toggleReviewSelection(review.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{review.properties?.title}</span>
                      <span className="text-sm text-muted-foreground">{review.properties?.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{review.comment || "No comment"}</TableCell>
                  <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {review.is_approved ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {review.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={review.is_approved ? "secondary" : "default"}
                        onClick={() => handleToggleApproved(review.id, !review.is_approved)}
                      >
                        {review.is_approved ? "Reject" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant={review.is_flagged ? "destructive" : "outline"}
                        onClick={() => handleToggleFlagged(review.id, !review.is_flagged)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteReview(review)}
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
        totalItems={filteredReviews.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">Delete Review?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              This will permanently delete this review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteReview(deleteReview?.id)}
              className="w-full sm:w-auto h-11 bg-destructive hover:bg-destructive/90"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedReviews.size} Reviews?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected reviews. This cannot be undone.
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

      {/* Bulk Approve Dialog */}
      <AlertDialog open={bulkApproveConfirm} onOpenChange={setBulkApproveConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selectedReviews.size} Reviews?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve all selected reviews and make them visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApprove} className="w-full sm:w-auto">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
