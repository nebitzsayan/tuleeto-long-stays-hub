
import PropertyReviewSystem from "./PropertyReviewSystem";

interface PropertyReviewsProps {
  propertyId: string;
  ownerId?: string;
  className?: string;
}

const PropertyReviews = ({ propertyId, ownerId, className }: PropertyReviewsProps) => {
  return <PropertyReviewSystem propertyId={propertyId} ownerId={ownerId} className={className} />;
};

export default PropertyReviews;
