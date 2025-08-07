
import React from 'react';
import { 
  Wifi, 
  Car, 
  Dumbbell, 
  Shield, 
  Utensils, 
  Waves, 
  TreePine, 
  Zap, 
  Wind, 
  Camera,
  PawPrint,
  Sofa,
  Tv,
  Refrigerator,
  Microwave
} from 'lucide-react';

interface PropertyAmenitiesDisplayProps {
  features: string[];
}

const getFeatureIcon = (feature: string) => {
  const lowerFeature = feature.toLowerCase();
  
  if (lowerFeature.includes('wifi') || lowerFeature.includes('internet')) {
    return <Wifi className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('parking') || lowerFeature.includes('garage')) {
    return <Car className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('gym') || lowerFeature.includes('fitness')) {
    return <Dumbbell className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('security') || lowerFeature.includes('guard')) {
    return <Shield className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('kitchen') || lowerFeature.includes('cooking')) {
    return <Utensils className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('pool') || lowerFeature.includes('swimming')) {
    return <Waves className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('garden') || lowerFeature.includes('park')) {
    return <TreePine className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('power') || lowerFeature.includes('electricity')) {
    return <Zap className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('ac') || lowerFeature.includes('air condition')) {
    return <Wind className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('cctv') || lowerFeature.includes('camera')) {
    return <Camera className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('pet') || lowerFeature.includes('animal')) {
    return <PawPrint className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('furnished') || lowerFeature.includes('furniture')) {
    return <Sofa className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('tv') || lowerFeature.includes('television')) {
    return <Tv className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('fridge') || lowerFeature.includes('refrigerator')) {
    return <Refrigerator className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  if (lowerFeature.includes('microwave') || lowerFeature.includes('oven')) {
    return <Microwave className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
  }
  
  // Default icon
  return <Shield className="h-5 w-5 text-tuleeto-orange flex-shrink-0" />;
};

const PropertyAmenitiesDisplay = ({ features }: PropertyAmenitiesDisplayProps) => {
  if (!features || features.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No amenities listed
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {features.map((feature, index) => (
        <div 
          key={index} 
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors min-h-[3rem]"
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {getFeatureIcon(feature)}
          </div>
          <span className="text-sm font-medium text-gray-700 leading-tight flex-1">
            {feature}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PropertyAmenitiesDisplay;
