
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle, ThumbsUp, Reply, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PROPERTY_REVIEWS_QUERY_KEY } from '@/hooks/useProperties';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { z } from 'zod';

// Validation schema for reviews
const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string()
    .max(1000, 'Comment must be less than 1000 characters')
    .regex(/^[^<>]*$/, 'HTML tags are not allowed')
    .optional()
    .nullable()
});

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  property_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Reply[];
  reactions?: Reaction[];
  userReaction?: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_reply_id: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Reply[];
}

interface Reaction {
  id: string;
  reaction_type: string;
  user_id: string;
}

interface PropertyReviewSystemProps {
  propertyId: string;
  ownerId?: string;
  className?: string;
}

const PropertyReviewSystem = ({ propertyId, ownerId, className }: PropertyReviewSystemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [showReplyForm, setShowReplyForm] = useState<{ [key: string]: boolean }>({});
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // Check if current user is the property owner
  const isPropertyOwner = user?.id === ownerId;
  
  // Prevent property owners from reviewing their own properties
  const canAddReview = user && !isPropertyOwner;

  const fetchReviewsQuery = async (): Promise<Review[]> => {
    // Fetch reviews with profiles
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('property_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        property_id
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    if (!reviewsData) return [];

    // Get unique user IDs from reviews
    const reviewUserIds = reviewsData.map(review => review.user_id);
    
    // Fetch profiles for review users
    const { data: reviewProfilesData, error: reviewProfilesError } = await supabase
      .from('public_profiles_safe')
      .select('id, full_name, avatar_url')
      .in('id', reviewUserIds);

    if (reviewProfilesError) throw reviewProfilesError;

    // Fetch replies for all reviews
    const reviewIds = reviewsData.map(review => review.id);
    const { data: repliesData, error: repliesError } = await supabase
      .from('review_replies')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_reply_id,
        review_id
      `)
      .in('review_id', reviewIds)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    // Get unique user IDs from replies
    const replyUserIds = repliesData?.map(reply => reply.user_id) || [];
    const allUserIds = [...new Set([...reviewUserIds, ...replyUserIds])];
    
    // Fetch profiles for all users (reviews + replies)
    const { data: allProfilesData, error: allProfilesError } = await supabase
      .from('public_profiles_safe')
      .select('id, full_name, avatar_url')
      .in('id', allUserIds);

    if (allProfilesError) throw allProfilesError;

    // Fetch reactions
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('review_reactions')
      .select(`
        id,
        reaction_type,
        user_id,
        review_id
      `)
      .in('review_id', reviewIds);

    if (reactionsError) throw reactionsError;

    // Create profile lookup map
    const profilesMap = new Map();
    allProfilesData?.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Enrich reviews with profiles, replies, and reactions
    const enrichedReviews: Review[] = reviewsData.map(review => {
      const reviewProfile = profilesMap.get(review.user_id);
      const reviewReplies = repliesData?.filter(reply => reply.review_id === review.id) || [];
      const reviewReactions = reactionsData?.filter(reaction => reaction.review_id === review.id) || [];
      const userReaction = reviewReactions.find(reaction => reaction.user_id === user?.id)?.reaction_type || null;
      
      // Enrich replies with profiles
      const enrichedReplies: Reply[] = reviewReplies.map(reply => ({
        ...reply,
        profiles: profilesMap.get(reply.user_id) || null
      }));
      
      return { 
        ...review, 
        profiles: reviewProfile || null,
        replies: enrichedReplies,
        reactions: reviewReactions,
        userReaction 
      };
    });
    
    return enrichedReviews;
  };

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [...PROPERTY_REVIEWS_QUERY_KEY, propertyId],
    queryFn: fetchReviewsQuery,
    staleTime: 30 * 1000,
  });

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: [...PROPERTY_REVIEWS_QUERY_KEY, propertyId] });
  };

  const validateReview = (reviewRating: number, reviewComment: string | null): boolean => {
    const result = reviewSchema.safeParse({ rating: reviewRating, comment: reviewComment });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return false;
    }
    return true;
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!canAddReview) {
      toast.error('Property owners cannot review their own properties');
      return;
    }

    const trimmedComment = comment.trim() || null;
    if (!validateReview(rating, trimmedComment)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('property_reviews')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          rating,
          comment: trimmedComment
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      invalidateReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(`Failed to submit review: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to like reviews');
      return;
    }

    try {
      const existingReaction = reviews.find(r => r.id === reviewId)?.reactions?.find(reaction => reaction.user_id === user.id);

      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('review_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('review_reactions')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: 'like'
          });

        if (insertError) throw insertError;
      }

      invalidateReviews();
    } catch (error: any) {
      console.error('Error liking review:', error);
      toast.error(`Failed to like review: ${error.message}`);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to reply to reviews');
      return;
    }

    const content = replyContent[reviewId]?.trim();
    if (!content) {
      toast.error('Reply cannot be empty');
      return;
    }

    // Validate reply content - no HTML tags
    if (/<[^>]*>/.test(content)) {
      toast.error('HTML tags are not allowed in replies');
      return;
    }

    if (content.length > 500) {
      toast.error('Reply must be less than 500 characters');
      return;
    }

    try {
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content
        });

      if (error) throw error;

      toast.success('Reply submitted successfully!');
      setReplyContent(prev => ({ ...prev, [reviewId]: '' }));
      setShowReplyForm(prev => ({ ...prev, [reviewId]: false }));
      invalidateReviews();
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(`Failed to submit reply: ${error.message}`);
    }
  };

  const handleEditReview = async () => {
    if (!user || !editingReview) return;

    const trimmedComment = editComment.trim() || null;
    if (!validateReview(editRating, trimmedComment)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('property_reviews')
        .update({
          rating: editRating,
          comment: trimmedComment
        })
        .eq('id', editingReview)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review updated successfully!');
      setEditingReview(null);
      invalidateReviews();
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(`Failed to update review: ${error.message}`);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to delete reviews');
      return;
    }

    try {
      const { error } = await supabase
        .from('property_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review deleted successfully!');
      invalidateReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(`Failed to delete review: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg"></div>;
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className={`space-y-4 sm:space-y-6 ${className || ''}`}>
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <h3 className="text-lg sm:text-xl font-semibold">Reviews & Ratings</h3>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Average Rating Display */}
          {reviews.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xl sm:text-2xl font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}

          {/* Write a Review Form */}
          {canAddReview && (
            <div className="border rounded-lg p-4">
              <h4 className="text-base sm:text-lg font-medium mb-4">Write a Review</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none p-1 touch-manipulation transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 sm:h-8 sm:w-8 ${
                            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                  <Textarea
                    placeholder="Share your experience with this property..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="text-base resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000</p>
                </div>

                <Button 
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || rating === 0}
                  className="w-full sm:w-auto h-11 bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          )}

          {!user && (
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Please login to write a review</p>
            </div>
          )}

          {isPropertyOwner && (
            <div className="text-center py-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-blue-600 dark:text-blue-400">Property owners cannot review their own properties</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={review.profiles?.avatar_url || ""} alt={review.profiles?.full_name || "User"} />
                      <AvatarFallback className="bg-tuleeto-orange text-white text-sm">
                        {review.profiles?.full_name ? (
                          review.profiles.full_name
                            .split(' ')
                            .map(name => name[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)
                        ) : (
                          'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {review.profiles?.full_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  {user?.id === review.user_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingReview(review.id);
                            setEditRating(review.rating);
                            setEditComment(review.comment || '');
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Star Rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => handleLikeReview(review.id)}
                      className={`flex items-center gap-1.5 text-sm touch-manipulation py-1 ${
                        review.userReaction === 'like' ? 'text-blue-600' : 'text-muted-foreground hover:text-blue-600'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>Like</span>
                      {review.reactions && review.reactions.length > 0 && (
                        <span className="text-xs">({review.reactions.length})</span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowReplyForm(prev => ({ ...prev, [review.id]: !showReplyForm[review.id] }))}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-600 touch-manipulation py-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Reply</span>
                    </button>
                  </div>
                  
                  {/* Reply Form */}
                  {showReplyForm[review.id] && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent[review.id] || ''}
                        onChange={(e) => setReplyContent(prev => ({ ...prev, [review.id]: e.target.value }))}
                        rows={2}
                        className="text-sm resize-none"
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {(replyContent[review.id] || '').length}/500
                        </p>
                        <Button 
                          onClick={() => handleReplySubmit(review.id)}
                          disabled={!replyContent[review.id]?.trim()}
                          size="sm"
                          className="h-9 bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                        >
                          Submit Reply
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                      {review.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={reply.profiles?.avatar_url || ""} alt={reply.profiles?.full_name || "User"} />
                              <AvatarFallback className="bg-tuleeto-orange text-white text-xs">
                                {reply.profiles?.full_name ? (
                                  reply.profiles.full_name
                                    .split(' ')
                                    .map(name => name[0])
                                    .join('')
                                    .toUpperCase()
                                    .substring(0, 2)
                                ) : (
                                  'U'
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">{reply.profiles?.full_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(reply.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-foreground">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet. Be the first to review this property!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEditRating(star)}
                    className="focus:outline-none p-1 touch-manipulation"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= editRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={3}
                className="text-base resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">{editComment.length}/1000</p>
            </div>
          </div>
          <Button 
            onClick={handleEditReview}
            disabled={editRating === 0}
            className="w-full h-11 bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
          >
            Update Review
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyReviewSystem;