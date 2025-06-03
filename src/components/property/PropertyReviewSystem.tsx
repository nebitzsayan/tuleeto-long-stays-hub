import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, MessageCircle, Send, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  review_id: string;
  parent_reply_id: string | null;
  user_profile: UserProfile;
  replies?: Reply[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  property_id: string;
  user_profile: UserProfile;
  replies: Reply[];
}

interface PropertyReviewSystemProps {
  propertyId: string;
  ownerId?: string;
  className?: string;
}

const PropertyReviewSystem = ({ propertyId, ownerId, className }: PropertyReviewSystemProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("property_reviews")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      const { data: repliesData, error: repliesError } = await supabase
        .from("review_replies")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .in("review_id", reviewsData?.map(r => r.id) || [])
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      const reviewsWithReplies = reviewsData?.map(review => {
        const reviewReplies = repliesData?.filter(reply => 
          reply.review_id === review.id && !reply.parent_reply_id
        ) || [];
        
        const organizeReplies = (parentReplies: any[]): Reply[] => {
          return parentReplies.map(reply => ({
            ...reply,
            user_profile: reply.profiles || { full_name: null, avatar_url: null },
            replies: organizeReplies(
              repliesData?.filter(r => r.parent_reply_id === reply.id) || []
            )
          }));
        };

        return {
          ...review,
          user_profile: review.profiles || { full_name: null, avatar_url: null },
          replies: organizeReplies(reviewReplies)
        };
      }) || [];

      setReviews(reviewsWithReplies);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please log in to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("property_reviews")
        .insert({
          property_id: propertyId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      setRating(0);
      setComment("");
      toast.success("Review submitted successfully!");
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (reviewId: string, parentReplyId?: string) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const { error } = await supabase
        .from("review_replies")
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_reply_id: parentReplyId || null
        });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply submitted successfully!");
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error("Failed to submit reply");
    }
  };

  const renderReplies = (replies: Reply[], depth = 0) => {
    if (!replies.length) return null;

    return (
      <div className={cn("space-y-3", depth > 0 && "ml-6 border-l-2 border-gray-100 pl-4")}>
        {replies.map((reply) => (
          <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reply.user_profile?.avatar_url || ""} />
                <AvatarFallback className="bg-tuleeto-orange text-white text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">
                    {reply.user_profile?.full_name || "Anonymous User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{reply.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setReplyingTo(reply.id)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                {replyingTo === reply.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(reply.review_id, reply.id)}
                        className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reviews ({reviews.length})</span>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{averageRating.toFixed(1)}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && user.id !== ownerId && (
          <div className="border-b pb-6">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          star <= rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300 hover:text-yellow-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                <Textarea
                  placeholder="Share your experience with this property..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0}
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to review this property!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.user_profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-tuleeto-orange text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">
                        {review.user_profile?.full_name || "Anonymous User"}
                      </span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= review.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                    
                    {replyingTo === review.id && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(review.id)}
                            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4">
                        {renderReplies(review.replies)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyReviewSystem;
