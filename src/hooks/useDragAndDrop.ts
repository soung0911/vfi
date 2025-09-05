import { useState } from "react";
import { toast } from "sonner";

interface UseDragAndDropProps {
  onDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
}

export const useDragAndDrop = ({
  onDrop,
  accept = [],
  multiple = false,
}: UseDragAndDropProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    if (!multiple && files.length > 1) {
      toast.error("Only one file can be selected");
      return;
    }

    if (files.length === 0) return;

    if (accept.length > 0) {
      const hasInvalidFile = files.some((file) => {
        const fileType = file.type;
        const isAccepted = accept.some((type) => {
          if (type.endsWith("/*")) {
            const mediaType = type.split("/")[0];
            return fileType.startsWith(`${mediaType}/`);
          }
          return type === fileType;
        });
        return !isAccepted;
      });

      if (hasInvalidFile) {
        toast.error("Unsupported file type included");
        return;
      }
    }

    onDrop(files);
  };

  return {
    isDragging,
    dragHandlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
};
