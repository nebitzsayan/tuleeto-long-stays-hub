import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Flag, Search, Download, Star, MessageSquare } from "lucide-react";
import { exportReviewsExcel } from "@/lib/adminExport";

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteReview, setDeleteReview] = useState<any>(null);

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
      fetchReviews();
    } catch (error: any) {
      toast.error("Failed to update review");
    }
  };

  const filteredReviews = reviews.filter((review) =>
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Review Management</h2>
          <p className="text-sm md:text-base text-muted-foreground">Moderate reviews across all properties</p>
        </div>
        <Button onClick={() => exportReviewsExcel(reviews)} variant="outline" size="sm" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No reviews found
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{review.properties?.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{review.properties?.location}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{review.rating}</span>
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
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant={review.is_approved ? "secondary" : "default"}
                    onClick={() => handleToggleApproved(review.id, !review.is_approved)}
                    className="flex-1 h-9 text-xs"
                  >
                    {review.is_approved ? "Reject" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant={review.is_flagged ? "destructive" : "outline"}
                    onClick={() => handleToggleFlagged(review.id, !review.is_flagged)}
                    className="h-9 w-9 p-0"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteReview(review)}
                    className="h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
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
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No reviews found</TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
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

      <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteReview(deleteReview?.id)}>
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}