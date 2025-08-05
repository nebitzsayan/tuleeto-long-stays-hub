import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle, ThumbsUp, Reply, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  };
  replies?: Reply[];
  reactions?: Reaction[];
  userReaction?: string;
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
  };
  replies?: Reply[];
}

interface Reaction {
  id: string;
  reaction_type: string;
  user_id: string;
}

interface PropertyReviewSystemProps {
  propertyId: string;
  ownerId: string;
}

const PropertyReviewSystem = ({ propertyId, ownerId }: PropertyReviewSystemProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [showReplyForm, setShowReplyForm] = useState<{ [key: string]: boolean }>({});
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // Check if current user is the property owner
  const isPropertyOwner = user?.id === ownerId;
  
  // Prevent property owners from reviewing their own properties
  const canAddReview = user && !isPropertyOwner;

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('property_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          property_id,
          profiles (
            full_name,
            avatar_url
          ),
          replies (
            id,
            content,
            created_at,
            user_id,
            parent_reply_id,
            profiles (
              full_name,
              avatar_url
            ),
            replies (
              id,
              content,
              created_at,
              user_id,
              parent_reply_id,
              profiles (
                full_name,
                avatar_url
              )
            )
          ),
          reactions (
            id,
            reaction_type,
            user_id
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const enrichedReviews = data.map(review => {
          const userReaction = review.reactions?.find(reaction => reaction.user_id === user?.id)?.reaction_type || null;
          return { ...review, userReaction };
        });
        setReviews(enrichedReviews as Review[]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
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

    if (rating === 0) {
      toast.error('Please select a rating');
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
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      fetchReviews();
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
        // If the user has already reacted, delete the existing reaction
        const { error: deleteError } = await supabase
          .from('review_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) throw deleteError;
      } else {
        // If the user hasn't reacted, insert a new like reaction
        const { error: insertError } = await supabase
          .from('review_reactions')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: 'like'
          });

        if (insertError) throw insertError;
      }

      // Refresh reviews to update the reactions
      fetchReviews();
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
      fetchReviews();
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(`Failed to submit reply: ${error.message}`);
    }
  };

  const handleEditReview = async () => {
    if (!user || !editingReview) return;

    if (editRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const { error } = await supabase
        .from('property_reviews')
        .update({
          rating: editRating,
          comment: editComment.trim() || null
        })
        .eq('id', editingReview)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review updated successfully!');
      setEditingReview(null);
      fetchReviews();
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
      fetchReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(`Failed to delete review: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-xl font-semibold mb-4">Reviews & Ratings</h3>
        
        {reviews.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          </div>
        )}

        {canAddReview && (
          <Card className="mb-6">
            <CardHeader>
              <h4 className="text-lg font-medium">Write a Review</h4>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        className={`h-6 w-6 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
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
                />
              </div>

              <Button 
                onClick={handleSubmitReview}
                disabled={isSubmitting || rating === 0}
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!user && (
          <div className="text-center py-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-gray-600">Please login to write a review</p>
          </div>
        )}

        {isPropertyOwner && (
          <div className="text-center py-4 bg-blue-50 rounded-lg mb-6">
            <p className="text-blue-600">Property owners cannot review their own properties</p>
          </div>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={review.profiles?.avatar_url || ""} alt={review.profiles?.full_name || "User"} />
                    <AvatarFallback className="bg-tuleeto-orange text-white">
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
                  <div>
                    <div className="font-medium">{review.profiles?.full_name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                {user?.id === review.user_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
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
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-gray-800">{review.comment}</p>}
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => handleLikeReview(review.id)}
                    className={`flex items-center space-x-1 text-sm ${
                      review.userReaction === 'like' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Like</span>
                  </button>
                  <button
                    onClick={() => setShowReplyForm(prev => ({ ...prev, [review.id]: !showReplyForm[review.id] }))}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                </div>
                {showReplyForm[review.id] && (
                  <div className="mt-4">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent[review.id] || ''}
                      onChange={(e) => setReplyContent(prev => ({ ...prev, [review.id]: e.target.value }))}
                      rows={2}
                      className="mb-2"
                    />
                    <Button 
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={!replyContent[review.id]?.trim()}
                      className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                    >
                      Submit Reply
                    </Button>
                  </div>
                )}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {review.replies.map((reply) => (
                      <Card key={reply.id} className="bg-gray-50">
                        <CardHeader className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={reply.profiles?.avatar_url || ""} alt={reply.profiles?.full_name || "User"} />
                              <AvatarFallback className="bg-tuleeto-orange text-white">
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
                              <div className="font-medium">{reply.profiles?.full_name || 'Anonymous'}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-800">{reply.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No reviews yet. Be the first to review this property!</p>
          </div>
        )}
      </div>

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogTrigger asChild>
          <Button variant="ghost"></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="rating" className="text-right text-sm font-medium leading-none text-gray-800">
                Rating
              </label>
              <div className="col-span-3 flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEditRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= editRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="comment" className="text-right text-sm font-medium leading-none text-gray-800">
                Comment
              </label>
              <div className="col-span-3">
                <Textarea
                  id="comment"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          </div>
          <Button 
            onClick={handleEditReview}
            disabled={editRating === 0}
            className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
          >
            Update Review
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyReviewSystem;
