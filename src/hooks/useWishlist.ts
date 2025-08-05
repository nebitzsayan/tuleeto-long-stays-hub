
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

      const { data, error } = await supabase
        .from('wishlists')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setWishlistItems(data.map(item => item.property_id));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (propertyId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
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

        if (error) throw error;

        setWishlistItems(prev => prev.filter(id => id !== propertyId));
        toast.success('Removed from wishlist');
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });

        if (error) throw error;

        setWishlistItems(prev => [...prev, propertyId]);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      toast.error(`Failed to update wishlist: ${error.message}`);
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
