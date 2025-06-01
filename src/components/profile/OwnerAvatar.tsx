
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OwnerAvatarProps {
  ownerId: string;
  ownerName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
}

const OwnerAvatar = ({ 
  ownerId, 
  ownerName = "Property Owner", 
  className = "",
  size = "md",
  withLink = true 
}: OwnerAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(ownerName);
  
  // Size mapping
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  // Fetch owner avatar
  useEffect(() => {
    const fetchOwnerAvatar = async () => {
      try {
        if (!ownerId) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', ownerId)
          .single();
          
        if (error) {
          console.error("Error fetching owner profile:", error);
          setError(error.message);
        } else if (data) {
          // Set avatar URL if available
          if (data.avatar_url) {
            // Handle both full URLs and relative paths
            const fullAvatarUrl = data.avatar_url.startsWith('http') 
              ? data.avatar_url 
              : `https://gokrqmykzovxqaoanapu.supabase.co/storage/v1/object/public/avatars/${data.avatar_url}`;
            setAvatarUrl(fullAvatarUrl);
          }
          
          // Set display name if available and not already provided
          if (data.full_name && (ownerName === "Property Owner" || !ownerName)) {
            setDisplayName(data.full_name);
          }
        }
      } catch (error: any) {
        console.error("Unexpected error fetching avatar:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnerAvatar();
  }, [ownerId, ownerName]);
  
  const AvatarComponent = () => (
    <Avatar className={`${sizeClass[size]} ${className} transition-transform hover:scale-105`}>
      <AvatarImage 
        src={avatarUrl || ""} 
        alt={displayName}
        onError={() => {
          console.log("Avatar image failed to load:", avatarUrl);
          setAvatarUrl(null);
        }}
      />
      <AvatarFallback className="bg-tuleeto-orange text-white">
        {!loading && displayName ? (
          displayName
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
  
  if (withLink && ownerId) {
    return (
      <Link to={`/owner/${ownerId}`} className="inline-block">
        <AvatarComponent />
      </Link>
    );
  }
  
  return <AvatarComponent />;
};

export default OwnerAvatar;
