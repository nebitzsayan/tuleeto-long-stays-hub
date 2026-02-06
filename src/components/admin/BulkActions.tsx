import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Trash2, Ban, Eye, EyeOff, CheckCircle } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isAllSelected: boolean;
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary";
    disabled?: boolean;
  }>;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  isAllSelected,
  actions = [],
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={() => onSelectAll()}
          className="h-4 w-4"
        />
        <span className="text-sm text-muted-foreground">
          Select all ({totalCount})
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={() => (isAllSelected ? onClearSelection() : onSelectAll())}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onClearSelection}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant || "outline"}
            size="sm"
            className="h-8 text-xs flex-1 sm:flex-initial"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="ml-1.5">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// Common bulk action configurations
export const commonBulkActions = {
  delete: (onClick: () => void) => ({
    label: "Delete",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    onClick,
    variant: "destructive" as const,
  }),
  ban: (onClick: () => void) => ({
    label: "Ban",
    icon: <Ban className="h-3.5 w-3.5" />,
    onClick,
    variant: "destructive" as const,
  }),
  unban: (onClick: () => void) => ({
    label: "Unban",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    onClick,
    variant: "outline" as const,
  }),
  makePublic: (onClick: () => void) => ({
    label: "Make Public",
    icon: <Eye className="h-3.5 w-3.5" />,
    onClick,
    variant: "outline" as const,
  }),
  makePrivate: (onClick: () => void) => ({
    label: "Make Private",
    icon: <EyeOff className="h-3.5 w-3.5" />,
    onClick,
    variant: "outline" as const,
  }),
  approve: (onClick: () => void) => ({
    label: "Approve",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    onClick,
    variant: "default" as const,
  }),
};
