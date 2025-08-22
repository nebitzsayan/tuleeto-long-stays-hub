
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface UploadProgressBarProps {
  totalFiles: number;
  completedFiles: number;
  currentFileName?: string;
  successCount: number;
  errorCount: number;
  isUploading: boolean;
}

export const UploadProgressBar = ({
  totalFiles,
  completedFiles,
  currentFileName,
  successCount,
  errorCount,
  isUploading
}: UploadProgressBarProps) => {
  const progress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
  
  if (!isUploading && completedFiles === 0) return null;

  return (
    <div className="w-full p-4 bg-white border rounded-lg shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : errorCount > 0 ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isUploading ? 'Uploading Photos...' : 'Upload Complete'}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {completedFiles} / {totalFiles}
        </span>
      </div>
      
      <Progress value={progress} className="w-full h-2" />
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {successCount > 0 && (
            <span className="text-green-600 font-medium">
              ✓ {successCount} successful
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-red-600 font-medium">
              ✗ {errorCount} failed
            </span>
          )}
        </div>
        {isUploading && currentFileName && (
          <span className="text-gray-600 truncate max-w-[200px]" title={currentFileName}>
            {currentFileName}
          </span>
        )}
      </div>
      
      {!isUploading && errorCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle className="h-3 w-3" />
          <span>Some photos failed to upload. You can retry them individually.</span>
        </div>
      )}
    </div>
  );
};
