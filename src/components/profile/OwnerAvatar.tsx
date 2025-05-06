
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
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', ownerId)
          .single();
          
        if (error) throw error;
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching owner avatar:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (ownerId) {
      fetchOwnerAvatar();
    }
  }, [ownerId]);
  
  const AvatarComponent = () => (
    <Avatar className={`${sizeClass[size]} ${className}`}>
      <AvatarImage src={avatarUrl || ""} alt={ownerName} />
      <AvatarFallback className="bg-tuleeto-orange text-white">
        {!loading ? (
          ownerName
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
  
  if (withLink) {
    return (
      <Link to={`/owner/${ownerId}`} className="inline-block">
        <AvatarComponent />
      </Link>
    );
  }
  
  return <AvatarComponent />;
};

export default OwnerAvatar;
