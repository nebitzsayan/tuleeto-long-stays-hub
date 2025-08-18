
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, RotateCcw } from "lucide-react";

export interface PhotoStatus {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface PhotoUploadStatusProps {
  photos: PhotoStatus[];
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
}

export const PhotoUploadStatus = ({ photos, onRemove, onRetry }: PhotoUploadStatusProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square relative">
              <img
                src={photo.preview}
                alt={`Property photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Status overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                {photo.status === 'uploading' && (
                  <div className="text-white text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                    <span className="text-xs">Uploading...</span>
                  </div>
                )}
                
                {photo.status === 'success' && (
                  <div className="text-green-400 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Uploaded</span>
                  </div>
                )}
                
                {photo.status === 'error' && (
                  <div className="text-red-400 text-center">
                    <XCircle className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Failed</span>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                {photo.status === 'error' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onRetry(index)}
                    title="Retry upload"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onRemove(index)}
                  title="Remove photo"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
              
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  Main Photo
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
