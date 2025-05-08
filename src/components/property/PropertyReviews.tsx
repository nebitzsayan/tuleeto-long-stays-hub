
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Send } from "lucide-react";
import { fetchPropertyReviews, submitReview, updateReviewReaction, submitReviewReply } from "@/lib/supabaseStorage";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface ReviewReaction {
  id: string;
  user_id: string;
  review_id: string;
  reaction_type: 'like' | 'dislike';
}

interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Review {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: ReviewProfile;
  reactions?: ReviewReaction[];
  replies?: ReviewReply[];
}

interface PropertyReviewsProps {
  propertyId: string;
  ownerId: string;
  className?: string;
}

const PropertyReviews = ({ propertyId, ownerId, className = "" }: PropertyReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Calculate average rating
  const averageRating = reviews.length 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;
    
  const roundedAverage = Math.round(averageRating * 10) / 10;
  
  // Fetch reviews on load
  useEffect(() => {
    const getReviews = async () => {
      try {
        setLoading(true);
        const data = await fetchPropertyReviews(propertyId);
        setReviews(data);
        
        // Check if user has already reviewed
        if (user) {
          const userReview = data.find(review => review.user_id === user.id);
          setHasReviewed(!!userReview);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getReviews();
  }, [propertyId, user]);
  
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please log in to submit a review");
      return;
    }
    
    if (ownerId === user.id) {
      toast.error("You cannot review your own property");
      return;
    }
    
    if (userRating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    
    try {
      setSubmitting(true);
      
      await submitReview({
        property_id: propertyId,
        user_id: user.id,
        rating: userRating,
        comment: comment.trim()
      });
      
      // Refresh reviews
      const data = await fetchPropertyReviews(propertyId);
      setReviews(data);
      
      // Reset form
      setUserRating(0);
      setComment("");
      setHasReviewed(true);
      
      toast.success("Review submitted successfully");
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(`Failed to submit review: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReaction = async (reviewId: string, reactionType: 'like' | 'dislike') => {
    if (!user) {
      toast.error("Please log in to react to reviews");
      return;
    }
    
    try {
      await updateReviewReaction(reviewId, user.id, reactionType);
      
      // Refresh reviews
      const data = await fetchPropertyReviews(propertyId);
      setReviews(data);
    } catch (err: any) {
      console.error("Error updating reaction:", err);
      toast.error(`Failed to update reaction: ${err.message}`);
    }
  };
  
  const handleReplySubmit = async (reviewId: string) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }
    
    const content = replyContent[reviewId];
    if (!content || content.trim() === "") {
      toast.error("Reply cannot be empty");
      return;
    }
    
    try {
      setSubmitting(true);
      
      await submitReviewReply({
        review_id: reviewId,
        user_id: user.id,
        content: content.trim()
      });
      
      // Refresh reviews
      const data = await fetchPropertyReviews(propertyId);
      setReviews(data);
      
      // Reset form
      setReplyContent(prev => ({
        ...prev,
        [reviewId]: ""
      }));
      setReplyingTo(null);
      
      toast.success("Reply submitted successfully");
    } catch (err: any) {
      console.error("Error submitting reply:", err);
      toast.error(`Failed to submit reply: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const StarRating = ({ value, onChange, onHover, onLeave, interactive = true }: any) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= (hoverRating || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onClick={() => interactive && onChange(star)}
            onMouseEnter={() => interactive && onHover(star)}
            onMouseLeave={() => interactive && onLeave()}
          />
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className={`mt-8 ${className}`}>
        <h3 className="text-xl font-semibold mb-4">Reviews</h3>
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`mt-8 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading reviews: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className={`mt-8 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Reviews</h3>
          {reviews.length > 0 ? (
            <div className="flex items-center">
              <StarRating value={roundedAverage} interactive={false} />
              <span className="ml-2 text-lg font-semibold">{roundedAverage}</span>
              <span className="ml-1 text-gray-500">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet</p>
          )}
        </div>
      </div>
      
      {user && !hasReviewed && user.id !== ownerId && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold mb-4">Write a Review</h4>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Rating</label>
              <StarRating
                value={userRating}
                onChange={setUserRating}
                onHover={setHoverRating}
                onLeave={() => setHoverRating(0)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Comment</label>
              <Textarea
                placeholder="Share your experience with this property..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
            <Button
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Link to={`/owner/${review.user_id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.profiles.avatar_url || undefined} />
                      <AvatarFallback>{review.profiles.full_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/owner/${review.user_id}`} className="font-medium hover:text-tuleeto-orange">
                          {review.profiles.full_name || 'Anonymous'}
                        </Link>
                        <div className="flex items-center mt-1">
                          <StarRating value={review.rating} interactive={false} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                    
                    <div className="flex items-center space-x-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-tuleeto-orange flex items-center space-x-1"
                        onClick={() => handleReaction(review.id, 'like')}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.reactions?.filter(r => r.reaction_type === 'like').length || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-tuleeto-orange flex items-center space-x-1"
                        onClick={() => handleReaction(review.id, 'dislike')}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{review.reactions?.filter(r => r.reaction_type === 'dislike').length || 0}</span>
                      </Button>
                      {user && (user.id === ownerId || user.id === review.user_id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-tuleeto-orange flex items-center space-x-1"
                          onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Reply</span>
                        </Button>
                      )}
                    </div>
                    
                    {/* Replies */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        {review.replies.map(reply => (
                          <div key={reply.id} className="mb-3 last:mb-0">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {reply.user_id === ownerId ? 'O' : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    {reply.user_id === ownerId ? 'Owner' : 'User'}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {format(new Date(reply.created_at), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm mt-1">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reply form */}
                    {replyingTo === review.id && user && (
                      <div className="mt-4 flex items-end space-x-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent[review.id] || ''}
                          onChange={(e) => setReplyContent(prev => ({
                            ...prev,
                            [review.id]: e.target.value
                          }))}
                          className="flex-1 text-sm min-h-[80px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(review.id)}
                          disabled={submitting}
                          className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardContent className="py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h4 className="text-lg font-medium">No Reviews Yet</h4>
            <p className="text-gray-500 mt-1">Be the first to review this property</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyReviews;
