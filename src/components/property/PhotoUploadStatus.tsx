
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { useImagePreview } from "@/hooks/useImagePreview";
import OptimizedImagePreview from "./OptimizedImagePreview";

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
  const { isPreviewOpen, previewIndex, openPreview, closePreview } = useImagePreview();

  // Get preview URLs for the modal
  const previewUrls = photos.map(photo => photo.url || photo.preview);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={photo.preview}
                  alt={`Property photo ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => openPreview(index)}
                />
                
                {/* Status overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                  photo.status === 'success' ? 'bg-green-500/20' : 
                  photo.status === 'error' ? 'bg-red-500/20' : 
                  photo.status === 'uploading' ? 'bg-blue-500/20' : 
                  'bg-gray-500/20'
                }`}>
                  {photo.status === 'uploading' && (
                    <div className="text-white text-center bg-black/60 rounded-lg p-3 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <span className="text-xs font-medium">Uploading...</span>
                    </div>
                  )}
                  
                  {photo.status === 'success' && (
                    <div className="text-green-400 text-center bg-black/60 rounded-lg p-3 backdrop-blur-sm">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-xs font-medium">Uploaded</span>
                    </div>
                  )}
                  
                  {photo.status === 'error' && (
                    <div className="text-red-400 text-center bg-black/60 rounded-lg p-3 backdrop-blur-sm">
                      <XCircle className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-xs font-medium">Failed</span>
                      {photo.error && (
                        <div className="text-xs text-red-300 mt-1 max-w-20 truncate" title={photo.error}>
                          {photo.error}
                        </div>
                      )}
                    </div>
                  )}

                  {photo.status === 'pending' && (
                    <div className="text-yellow-400 text-center bg-black/60 rounded-lg p-3 backdrop-blur-sm">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-xs font-medium">Pending</span>
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
                      className="h-7 w-7 p-0 bg-white/90 hover:bg-white text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(index);
                      }}
                      title={`Retry upload${photo.error ? `: ${photo.error}` : ''}`}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0 bg-red-500/90 hover:bg-red-600/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    title="Remove photo"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Main photo indicator */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-tuleeto-orange text-white text-xs px-2 py-1 rounded font-medium">
                    Main Photo
                  </div>
                )}

                {/* File size indicator */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {(photo.file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optimized Image Preview Modal */}
      <OptimizedImagePreview
        isOpen={isPreviewOpen}
        onClose={closePreview}
        images={previewUrls}
        initialIndex={previewIndex}
        title="Property Photos"
      />
    </>
  );
};
