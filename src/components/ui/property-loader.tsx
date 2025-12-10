import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const PropertyLoader = ({ size = "md", text, className }: PropertyLoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "rounded-full bg-primary/20 animate-property-pulse",
            size === "sm" && "w-10 h-10",
            size === "md" && "w-16 h-16",
            size === "lg" && "w-24 h-24"
          )} />
        </div>
        
        {/* Main icon */}
        <Home className={cn(
          "text-primary animate-property-bounce relative z-10",
          sizeClasses[size]
        )} />
      </div>
      
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium animate-pulse",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default PropertyLoader;
