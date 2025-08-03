
import PropertyImageCollage from "./PropertyImageCollage";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  return <PropertyImageCollage images={images} title={title} />;
};

export default PropertyImageCarousel;
