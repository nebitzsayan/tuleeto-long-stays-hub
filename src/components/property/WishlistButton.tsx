
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

const WishlistButton = ({ 
  propertyId, 
  className = "", 
  size = "sm",
  variant = "ghost"
}: WishlistButtonProps) => {
  const { toggleWishlist, isInWishlist, loading } = useWishlist();
  const inWishlist = isInWishlist(propertyId);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleWishlist(propertyId);
      }}
      disabled={loading}
      className={cn(
        "transition-colors",
        inWishlist ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4", 
          inWishlist ? "fill-current" : ""
        )} 
      />
    </Button>
  );
};

export default WishlistButton;
