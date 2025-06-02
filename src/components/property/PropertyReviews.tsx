
import PropertyReviewSystem from "./PropertyReviewSystem";

interface PropertyReviewsProps {
  propertyId: string;
}

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  return <PropertyReviewSystem propertyId={propertyId} />;
};

export default PropertyReviews;
