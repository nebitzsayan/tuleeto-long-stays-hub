import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, description, className }: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-xl md:text-3xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs md:text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
