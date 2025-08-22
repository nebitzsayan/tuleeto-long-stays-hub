
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Clock, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UploadProgressProps {
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  errorCount: number;
  currentFileName?: string;
  isUploading: boolean;
  uploadSpeed?: string;
  timeRemaining?: string;
  errorDetails?: string[];
}

export const EnhancedUploadProgress = ({
  totalFiles,
  completedFiles,
  successCount,
  errorCount,
  currentFileName,
  isUploading,
  uploadSpeed,
  timeRemaining,
  errorDetails
}: UploadProgressProps) => {
  const progress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
  const pendingCount = totalFiles - completedFiles;
  
  if (!isUploading && completedFiles === 0) return null;

  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (errorCount > 0 && successCount === 0) return <XCircle className="h-5 w-5 text-red-500" />;
    if (errorCount > 0 && successCount > 0) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (isUploading) return 'Uploading Photos...';
    if (errorCount > 0 && successCount === 0) return 'Upload Failed';
    if (errorCount > 0 && successCount > 0) return 'Upload Completed with Errors';
    return 'Upload Complete';
  };

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-sm">{getStatusText()}</h4>
              {isUploading && currentFileName && (
                <p className="text-xs text-gray-500 truncate max-w-[200px]" title={currentFileName}>
                  {currentFileName}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {completedFiles} / {totalFiles}
            </div>
            {isUploading && timeRemaining && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeRemaining}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="w-full h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress}% complete</span>
            {uploadSpeed && isUploading && (
              <span className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {uploadSpeed}
              </span>
            )}
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {successCount > 0 && (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              ✓ {successCount} uploaded
            </Badge>
          )}
          {pendingCount > 0 && isUploading && (
            <Badge variant="secondary" className="text-blue-700 bg-blue-100">
              ⏳ {pendingCount} pending
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-700">
              ✗ {errorCount} failed
            </Badge>
          )}
        </div>
        
        {/* Error Details */}
        {!isUploading && errorCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="text-sm font-medium text-red-800 mb-1">
                  Upload Issues
                </h5>
                <p className="text-sm text-red-700 mb-2">
                  {errorCount} photo{errorCount > 1 ? 's' : ''} failed to upload. You can retry them individually.
                </p>
                {errorDetails && errorDetails.length > 0 && (
                  <div className="space-y-1">
                    {errorDetails.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-xs text-red-600 font-mono bg-red-100 p-1 rounded">
                        {error}
                      </p>
                    ))}
                    {errorDetails.length > 3 && (
                      <p className="text-xs text-red-600">
                        ...and {errorDetails.length - 3} more errors
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {!isUploading && errorCount === 0 && successCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-700">
                All photos uploaded successfully! Your images are now ready for your property listing.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
