
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart } from 'lucide-react';
import PropertyListingCard, { PropertyType } from '@/components/property/PropertyListingCard';
import { Button } from '@/components/ui/button';

const WishlistPage = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlistProperties();
    }
  }, [user]);

  const fetchWishlistProperties = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          property_id,
          properties!inner (
            id,
            title,
            location,
            price,
            bedrooms,
            bathrooms,
            area,
            images,
            type,
            contact_phone,
            is_public,
            owner_id
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedProperties = data
        .filter(item => item.properties.is_public !== false)
        .map(item => ({
          id: item.properties.id,
          title: item.properties.title,
          location: item.properties.location,
          price: item.properties.price,
          bedrooms: item.properties.bedrooms,
          bathrooms: item.properties.bathrooms,
          area: item.properties.area,
          image: item.properties.images[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
          type: item.properties.type,
          contact_phone: item.properties.contact_phone || "",
          is_public: item.properties.is_public,
          owner_id: item.properties.owner_id
        }));

      setProperties(formattedProperties);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-24 px-4 bg-tuleeto-off-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange mx-auto mb-4" />
            <p className="text-gray-500">Loading your wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-bold">My Wishlist</h1>
          </div>
          
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {properties.map((property) => (
                <PropertyListingCard 
                  key={property.id}
                  property={property} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-6">Start adding properties you love to your wishlist</p>
              <Link to="/listings">
                <Button className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark">
                  Browse Properties
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WishlistPage;
