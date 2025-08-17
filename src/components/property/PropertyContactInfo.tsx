
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { secureLog, logSecurityEvent } from '@/lib/secureLogging';

interface PropertyContactInfoProps {
  propertyId: string;
  ownerId: string;
  ownerName: string;
}

interface ContactDetails {
  contact_phone?: string;
  contact_email?: string;
}

const PropertyContactInfo = ({ propertyId, ownerId, ownerName }: PropertyContactInfoProps) => {
  const { user } = useAuth();
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchContactDetails = async () => {
    if (!user) {
      toast.error('Please login to view contact details');
      return;
    }

    try {
      setLoading(true);
      secureLog.info('Fetching contact details for property');

      const { data, error } = await supabase
        .from('property_contact_details')
        .select('contact_phone, contact_email')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) {
        secureLog.error('Error fetching contact details', error);
        throw error;
      }

      setContactDetails(data);
      setShowDetails(true);
      
      // Log security event for contact access
      await logSecurityEvent('contact_details_viewed', {
        propertyId,
        ownerId,
        viewedBy: user.id
      });

    } catch (error: any) {
      secureLog.error('Failed to fetch contact details', error);
      toast.error('Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Please login to view contact details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="h-5 w-5" />
          <span>Contact Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Property Owner</p>
            <p className="text-gray-600">{ownerName || 'Property Owner'}</p>
          </div>

          {!showDetails ? (
            <Button
              onClick={fetchContactDetails}
              disabled={loading}
              className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Contact Details
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => setShowDetails(false)}
                variant="outline"
                size="sm"
                className="mb-3"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Details
              </Button>

              {contactDetails?.contact_phone && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-tuleeto-orange" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{contactDetails.contact_phone}</p>
                  </div>
                </div>
              )}

              {contactDetails?.contact_email && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-tuleeto-orange" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{contactDetails.contact_email}</p>
                  </div>
                </div>
              )}

              {!contactDetails?.contact_phone && !contactDetails?.contact_email && (
                <p className="text-gray-500">No contact details available</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyContactInfo;
