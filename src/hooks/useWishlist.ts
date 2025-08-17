
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { secureLog, logSecurityEvent } from '@/lib/secureLogging';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      if (!user) return;

      secureLog.info('Fetching user wishlist');

      const { data, error } = await supabase
        .from('wishlists')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) {
        secureLog.error('Error fetching wishlist', error);
        throw error;
      }

      setWishlistItems(data.map(item => item.property_id));
      secureLog.info('Wishlist fetched successfully');
    } catch (error) {
      secureLog.error('Error fetching wishlist', error);
      await logSecurityEvent('wishlist_fetch_error', { 
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (propertyId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      await logSecurityEvent('wishlist_unauthorized_attempt', { propertyId });
      return;
    }

    try {
      const isInWishlist = wishlistItems.includes(propertyId);

      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) {
          secureLog.error('Error removing from wishlist', error);
          throw error;
        }

        setWishlistItems(prev => prev.filter(id => id !== propertyId));
        toast.success('Removed from wishlist');
        
        await logSecurityEvent('wishlist_item_removed', {
          userId: user.id,
          propertyId
        });
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });

        if (error) {
          secureLog.error('Error adding to wishlist', error);
          throw error;
        }

        setWishlistItems(prev => [...prev, propertyId]);
        toast.success('Added to wishlist');
        
        await logSecurityEvent('wishlist_item_added', {
          userId: user.id,
          propertyId
        });
      }
    } catch (error: any) {
      secureLog.error('Error toggling wishlist', error);
      await logSecurityEvent('wishlist_toggle_error', {
        userId: user?.id,
        propertyId,
        error: error.message
      });
      toast.error('Failed to update wishlist. Please try again.');
    }
  };

  const isInWishlist = (propertyId: string) => {
    return wishlistItems.includes(propertyId);
  };

  return {
    wishlistItems,
    loading,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist
  };
};
