
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface Reply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_reply_id?: string | null;
  user_profile?: UserProfile | null;
  nested_replies?: Reply[];
}

interface Review {
  id: string;
  user_id: string;
  property_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profile?: UserProfile | null;
  replies?: Reply[];
}

interface PropertyReviewSystemProps {
  propertyId: string;
}

const PropertyReviewSystem = ({ propertyId }: PropertyReviewSystemProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      // First fetch reviews with user profiles
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('property_reviews')
        .select(`
          *,
          profiles!property_reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then fetch replies with user profiles
      const { data: repliesData, error: repliesError } = await supabase
        .from('review_replies')
        .select(`
          *,
          profiles!review_replies_user_id_fkey(full_name, avatar_url)
        `)
        .in('review_id', reviewsData?.map(r => r.id) || [])
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Organize replies by review
      const reviewsWithReplies = reviewsData?.map(review => ({
        ...review,
        user_profile: review.profiles,
        replies: repliesData?.filter(reply => reply.review_id === review.id).map(reply => ({
          ...reply,
          user_profile: reply.profiles,
          nested_replies: repliesData?.filter(nestedReply => 
            nestedReply.parent_reply_id === reply.id
          ).map(nestedReply => ({
            ...nestedReply,
            user_profile: nestedReply.profiles
          })) || []
        })) || []
      })) || [];

      setReviews(reviewsWithReplies);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('property_reviews')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment.trim()
        });

      if (error) throw error;

      setNewReview({ rating: 5, comment: "" });
      toast.success('Review submitted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (reviewId: string, parentReplyId?: string) => {
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Please write a reply');
      return;
    }

    try {
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_reply_id: parentReplyId
        });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      toast.success('Reply submitted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Failed to submit reply');
    }
  };

  const toggleReplies = (reviewId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReplies(newExpanded);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 transition-all duration-100 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
            onClick={interactive ? () => setNewReview(prev => ({ ...prev, rating: star })) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderReply = (reply: Reply, level = 0) => (
    <div
      key={reply.id}
      className={`transition-all duration-200 ${
        level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''
      }`}
    >
      <div className="mb-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={reply.user_profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-tuleeto-orange text-white text-xs">
              {reply.user_profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{reply.user_profile?.full_name || 'Anonymous'}</span>
              <span className="text-xs text-gray-500">
                {new Date(reply.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
            {level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(reply.id)}
                className="text-xs h-6 px-2 text-tuleeto-orange hover:text-tuleeto-orange-dark transition-colors"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
        
        {replyingTo === reply.id && (
          <div className="mt-3 transition-all duration-200">
            <div className="flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[60px] text-sm resize-none"
              />
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => submitReply(reply.review_id, reply.id)}
                  className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark h-8 px-3"
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {reply.nested_replies?.map((nestedReply) => renderReply(nestedReply, level + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit Review Form */}
      {user && (
        <Card className="border border-tuleeto-orange/30 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Leave a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Rating</label>
                {renderStars(newReview.rating, true)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Comment</label>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this property..."
                  className="min-h-[100px] resize-none"
                />
              </div>
              <Button
                onClick={submitReview}
                disabled={submitting}
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark transition-all duration-200 px-6 py-2"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-gray-800">Reviews ({reviews.length})</h3>
        
        {reviews.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 text-lg">No reviews yet. Be the first to leave a review!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="transition-all duration-200 hover:shadow-lg border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={review.user_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-tuleeto-orange text-white font-medium">
                      {review.user_profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{review.user_profile?.full_name || 'Anonymous'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(review.id)}
                        className="text-tuleeto-orange hover:text-tuleeto-orange-dark transition-colors hover:bg-tuleeto-orange/5"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                      
                      {review.replies && review.replies.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReplies(review.id)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          {expandedReplies.has(review.id) ? (
                            <ChevronUp className="w-4 h-4 mr-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mr-1" />
                          )}
                          {review.replies.length} {review.replies.length === 1 ? 'Reply' : 'Replies'}
                        </Button>
                      )}
                    </div>

                    {replyingTo === review.id && (
                      <div className="mt-4 transition-all duration-200">
                        <div className="flex gap-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            className="min-h-[80px] resize-none"
                          />
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => submitReply(review.id)}
                              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {expandedReplies.has(review.id) && review.replies && (
                      <div className="mt-4 space-y-3">
                        {review.replies.map((reply) => renderReply(reply))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyReviewSystem;
