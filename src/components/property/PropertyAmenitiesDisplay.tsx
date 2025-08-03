
import { 
  Wifi, 
  Car, 
  Snowflake, 
  Heart, 
  Shield,
  Tv,
  Waves,
  Dumbbell,
  UtensilsCrossed,
  Shirt,
  Users
} from "lucide-react";

interface PropertyAmenitiesDisplayProps {
  features: string[];
  className?: string;
}

const amenityIcons: { [key: string]: any } = {
  'WiFi': Wifi,
  'Internet': Wifi,
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Car parking': Car,
  'Air conditioning': Snowflake,
  'AC': Snowflake,
  'Pet friendly': Heart,
  'Security': Shield,
  'CCTV': Shield,
  'TV': Tv,
  'Cable TV': Tv,
  'Swimming Pool': Waves,
  'Pool': Waves,
  'Gym': Dumbbell,
  'Fitness': Dumbbell,
  'Kitchen': UtensilsCrossed,
  'Laundry': Shirt,
  'Washing Machine': Shirt,
  'Common Area': Users,
  'Balcony': Users
};

const PropertyAmenitiesDisplay = ({ features, className = "" }: PropertyAmenitiesDisplayProps) => {
  if (!features || features.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500">No amenities listed</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Mobile: Stacked list with proper spacing */}
      <div className="block md:hidden space-y-3">
        {features.map((feature, index) => {
          const IconComponent = amenityIcons[feature] || Shield;
          return (
            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-tuleeto-orange" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{feature}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const IconComponent = amenityIcons[feature] || Shield;
          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-tuleeto-orange" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{feature}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyAmenitiesDisplay;
