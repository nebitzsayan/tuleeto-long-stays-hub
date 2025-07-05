
import { useState } from "react";

export const useImagePreview = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return {
    isPreviewOpen,
    previewIndex,
    openPreview,
    closePreview
  };
};
