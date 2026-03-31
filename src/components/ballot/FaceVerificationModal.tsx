import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, CheckCircle, Camera, RotateCcw, XCircle, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FaceVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationComplete: () => void;
  candidateName: string;
}

type VerificationStatus = 'idle' | 'scanning' | 'success' | 'failed';

export function FaceVerificationModal({
  open,
  onOpenChange,
  onVerificationComplete,
  candidateName,
}: FaceVerificationModalProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setProgress(0);
    }
  }, [open]);

  const handleScan = () => {
    setStatus('scanning');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate 95% success rate
          const isSuccess = Math.random() > 0.05;
          setStatus(isSuccess ? 'success' : 'failed');
          
          if (isSuccess) {
            setTimeout(() => {
              onVerificationComplete();
            }, 1500);
          }
          return 100;
        }
        return prev + 4;
      });
    }, 100);
  };

  const handleRetry = () => {
    setStatus('idle');
    setProgress(0);
  };

  const handleClose = () => {
    if (status !== 'scanning') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="size-5 text-primary" />
            নিরাপত্তা যাচাইকরণ
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="size-16 sm:size-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 sm:size-10 text-success" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-success">যাচাইকরণ সফল!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                আপনার ভোট <strong>{candidateName}</strong>-এর পক্ষে জমা হচ্ছে...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin size-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            </motion.div>
          ) : status === 'failed' ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="size-16 sm:size-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-8 sm:size-10 text-destructive" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-destructive">যাচাইকরণ ব্যর্থ</h3>
              <p className="text-sm text-muted-foreground mb-6">
                চেহারা মিলেনি। অনুগ্রহ করে আবার চেষ্টা করুন।
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  বাতিল করুন
                </Button>
                <Button onClick={handleRetry}>
                  <RotateCcw className="size-4 mr-2" />
                  আবার চেষ্টা করুন
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Info Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ভোট জমা দেওয়ার আগে আপনার পরিচয় যাচাই করতে হবে। পর্যাপ্ত আলোতে সরাসরি ক্যামেরার দিকে তাকান।
                  </p>
                </div>
              </div>

              {/* Camera Preview */}
              <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-4">
                <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 z-10">
                  <span className="size-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Scan Frame */}
                <div className="absolute inset-6 sm:inset-8 border-2 border-dashed border-primary/50 rounded-lg">
                  {status === 'scanning' && (
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      style={{ top: `${progress}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </div>

                {/* Face Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ScanFace className={cn(
                      "size-12 sm:size-16 mx-auto mb-2 transition-colors",
                      status === 'scanning' ? "text-primary animate-pulse" : "opacity-50"
                    )} />
                    <p className="text-xs sm:text-sm">
                      {status === 'scanning' ? 'স্ক্যান করা হচ্ছে...' : 'চেহারা এখানে রাখুন'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-muted-foreground">ফেস ম্যাচিং</span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={status === 'scanning'}
                >
                  বাতিল করুন
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleScan}
                  disabled={status === 'scanning'}
                >
                  <Camera className="size-4 mr-2" />
                  {status === 'scanning' ? 'যাচাই হচ্ছে...' : 'যাচাই শুরু করুন'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
