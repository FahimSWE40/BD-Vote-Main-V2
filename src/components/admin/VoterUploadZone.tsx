import { memo, forwardRef, useCallback, useMemo } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface VoterUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  processingProgress?: number;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

// Memoized file preview component to prevent re-renders
const FilePreviewItem = memo(function FilePreviewItem({
  item,
  onRemove,
  disabled,
}: {
  item: UploadedFile;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item.id);
  }, [item.id, onRemove]);

  return (
    <div className="relative group rounded-md sm:rounded-lg overflow-hidden border border-border bg-card">
      <img 
        src={item.preview} 
        alt="ID Card Preview"
        className="w-full h-16 sm:h-20 md:h-24 object-cover"
        loading="lazy"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 size-5 sm:size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleRemove}
        disabled={disabled}
      >
        <X className="size-2.5 sm:size-3" />
      </Button>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 sm:px-2 py-0.5 sm:py-1">
        <p className="text-[10px] sm:text-xs text-white truncate">{item.file.name}</p>
      </div>
    </div>
  );
});

// Use forwardRef to fix the ref warning
export const VoterUploadZone = forwardRef<HTMLDivElement, VoterUploadZoneProps>(
  function VoterUploadZone({
    onFilesSelected,
    isProcessing,
    processingProgress = 0,
    uploadedFiles,
    onRemoveFile,
  }, ref) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const dropzoneOptions: DropzoneOptions = useMemo(() => ({
      onDrop,
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      },
      disabled: isProcessing,
      multiple: true,
      maxSize: 10 * 1024 * 1024, // 10MB max
    }), [onDrop, isProcessing]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    // Memoize the file list to prevent unnecessary re-renders
    const fileList = useMemo(() => (
      uploadedFiles.map((item) => (
        <FilePreviewItem
          key={item.id}
          item={item}
          onRemove={onRemoveFile}
          disabled={isProcessing}
        />
      ))
    ), [uploadedFiles, onRemoveFile, isProcessing]);

    return (
      <div ref={ref} className="space-y-3 sm:space-y-4">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 transition-all cursor-pointer",
            "flex flex-col items-center justify-center gap-3 sm:gap-4 min-h-[160px] sm:min-h-[200px]",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          <div className={cn(
            "size-12 sm:size-16 rounded-full flex items-center justify-center transition-colors",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}>
            {isProcessing ? (
              <Loader2 className="size-6 sm:size-8 text-primary animate-spin" />
            ) : (
              <Upload className={cn(
                "size-6 sm:size-8 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} />
            )}
          </div>
          
          <div className="text-center px-2">
            <p className="text-sm sm:text-base md:text-lg font-medium text-foreground">
              {isDragActive 
                ? "ছবিগুলো এখানে ড্রপ করুন" 
                : isProcessing 
                  ? "প্রসেস হচ্ছে..."
                  : "আইডি কার্ডের ছবি আপলোড করুন"
              }
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              ড্র্যাগ অ্যান্ড ড্রপ করুন অথবা ক্লিক করে সিলেক্ট করুন
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              JPG, PNG, WEBP (সর্বোচ্চ ১০MB)
            </p>
          </div>
          
          {isProcessing && processingProgress > 0 && (
            <div className="w-full max-w-xs px-4">
              <Progress value={processingProgress} className="h-1.5 sm:h-2" />
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">
                {processingProgress.toFixed(0)}% সম্পন্ন
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-foreground">
              আপলোড করা ছবি ({uploadedFiles.length}টি)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {fileList}
            </div>
          </div>
        )}
      </div>
    );
  }
);
