
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Home, MessageSquare, Shield, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  created_at: string;
  is_public: boolean;
  owner: {
    email: string;
    full_name: string | null;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
  property: {
    title: string;
  };
}

const AdminPanel = () => {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'properties' | 'reviews'>('users');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!userProfile?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/');
      return;
    }

    fetchData();
  }, [user, userProfile, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          created_at
        `);

      if (usersError) throw usersError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine users with their roles
      const usersWithRoles = usersData?.map(user => ({
        ...user,
        role: rolesData?.find(r => r.user_id === user.id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);

      // Fetch properties with owner info
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          location,
          price,
          created_at,
          is_public,
          owner_id
        `);

      if (propertiesError) throw propertiesError;

      // Get owner profiles
      const ownerIds = propertiesData?.map(p => p.owner_id) || [];
      const { data: ownersData, error: ownersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds);

      if (ownersError) throw ownersError;

      const propertiesWithOwners = propertiesData?.map(property => ({
        ...property,
        owner: ownersData?.find(o => o.id === property.owner_id) || { email: 'Unknown', full_name: null }
      })) || [];

      setProperties(propertiesWithOwners);

      // Fetch reviews with user and property info
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
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Get user and property info for reviews
      const reviewUserIds = reviewsData?.map(r => r.user_id) || [];
      const reviewPropertyIds = reviewsData?.map(r => r.property_id) || [];

      const { data: reviewUsersData, error: reviewUsersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', reviewUserIds);

      if (reviewUsersError) throw reviewUsersError;

      const { data: reviewPropertiesData, error: reviewPropertiesError } = await supabase
        .from('properties')
        .select('id, title')
        .in('id', reviewPropertyIds);

      if (reviewPropertiesError) throw reviewPropertiesError;

      const reviewsWithDetails = reviewsData?.map(review => ({
        ...review,
        user: reviewUsersData?.find(u => u.id === review.user_id) || { email: 'Unknown', full_name: null },
        property: reviewPropertiesData?.find(p => p.id === review.property_id) || { title: 'Unknown Property' }
      })) || [];

      setReviews(reviewsWithDetails);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('property_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Review deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
          <div className="container max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow pt-24 px-4 pb-12 bg-tuleeto-off-white">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-tuleeto-orange" />
            <h1 className="text-3xl md:text-4xl font-bold">Admin Panel</h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Home className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <MessageSquare className="h-8 w-8 text-purple-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'bg-tuleeto-orange hover:bg-tuleeto-orange-dark' : ''}
            >
              Users
            </Button>
            <Button
              variant={activeTab === 'properties' ? 'default' : 'outline'}
              onClick={() => setActiveTab('properties')}
              className={activeTab === 'properties' ? 'bg-tuleeto-orange hover:bg-tuleeto-orange-dark' : ''}
            >
              Properties
            </Button>
            <Button
              variant={activeTab === 'reviews' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reviews')}
              className={activeTab === 'reviews' ? 'bg-tuleeto-orange hover:bg-tuleeto-orange-dark' : ''}
            >
              Reviews
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'properties' && (
            <Card>
              <CardHeader>
                <CardTitle>Properties Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{property.title}</p>
                        <p className="text-sm text-gray-500">{property.location}</p>
                        <p className="text-sm text-gray-500">
                          Owner: {property.owner.full_name || property.owner.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Listed: {new Date(property.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={property.is_public ? 'default' : 'secondary'}>
                          {property.is_public ? 'Public' : 'Private'}
                        </Badge>
                        <p className="font-bold text-tuleeto-orange">${property.price}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/property/${property.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'reviews' && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.comment || 'No comment'}</p>
                        <p className="text-xs text-gray-500">
                          By: {review.user.full_name || review.user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Property: {review.property.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
