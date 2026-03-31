import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, CheckCircle, Camera, RotateCcw, XCircle, Shield, Info, AlertCircle, Loader2, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ExtractedData } from "@/lib/ocr";
import { useCamera } from "@/hooks/use-camera";
import { loadFaceModels, verifyFaceAgainstImage, areModelsLoaded, detectFace, FaceVerificationResult, ModelLoadProgress } from "@/lib/face-verification";
import { supabase } from "@/integrations/supabase/client";

interface AdminFaceVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationComplete: () => void;
  onVerificationFailed: () => void;
  idCardData: ExtractedData | null;
}

type VerificationStatus = 'initializing' | 'permission' | 'ready' | 'capturing' | 'captured' | 'processing' | 'success' | 'failed';
type CameraPermission = 'prompt' | 'granted' | 'denied' | 'checking';

export function AdminFaceVerification({
  open,
  onOpenChange,
  onVerificationComplete,
  onVerificationFailed,
  idCardData,
}: AdminFaceVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('initializing');
  const [progress, setProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [idCardImageUrl, setIdCardImageUrl] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('checking');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState<ModelLoadProgress | null>(null);
  const maxAttempts = 3;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const faceDetectionIntervalRef = useRef<number | null>(null);

  const { videoRef, isActive, error: cameraError, startCamera, stopCamera } = useCamera({
    facingMode: 'user',
    width: 640,
    height: 480,
  });

  // Initialize everything when dialog opens
  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const initialize = async () => {
      // Step 1: Load face models with progress tracking
      if (!areModelsLoaded()) {
        try {
          await loadFaceModels((progress) => {
            if (mounted) setModelLoadProgress(progress);
          });
          if (mounted) {
            setModelsReady(true);
            setModelLoadProgress(null);
          }
        } catch (error) {
          console.error('Failed to load face models:', error);
          if (mounted) setErrorMessage('ফেস মডেল লোড করতে ব্যর্থ হয়েছে');
          return;
        }
      } else {
        if (mounted) setModelsReady(true);
      }

      // Step 2: Check camera permission
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (mounted) {
            if (result.state === 'granted') {
              setCameraPermission('granted');
            } else if (result.state === 'denied') {
              setCameraPermission('denied');
            } else {
              setCameraPermission('prompt');
            }
          }
          
          result.onchange = () => {
            if (!mounted) return;
            if (result.state === 'granted') {
              setCameraPermission('granted');
            } else if (result.state === 'denied') {
              setCameraPermission('denied');
            }
          };
        } else {
          if (mounted) setCameraPermission('prompt');
        }
      } catch (error) {
        console.error('Permission check error:', error);
        if (mounted) setCameraPermission('prompt');
      }

      // Step 3: Fetch ID card image
      if (idCardData) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user || !mounted) return;

          const { data: files } = await supabase.storage
            .from('id-cards')
            .list(`admin/${userData.user.id}`, {
              limit: 1,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (files && files.length > 0 && mounted) {
            const { data: urlData } = await supabase.storage
              .from('id-cards')
              .createSignedUrl(`admin/${userData.user.id}/${files[0].name}`, 3600);

            if (urlData?.signedUrl && mounted) {
              setIdCardImageUrl(urlData.signedUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching ID card image:', error);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [open, idCardData]);

  // Transition from initializing to permission/ready based on state
  useEffect(() => {
    if (!open || !modelsReady) return;
    
    // Still checking permission
    if (cameraPermission === 'checking') {
      return;
    }
    
    // Need to prompt for permission
    if (cameraPermission === 'prompt' || cameraPermission === 'denied') {
      setStatus('permission');
      if (cameraPermission === 'denied') {
        setErrorMessage('ক্যামেরা অ্যাক্সেস অনুমতি দেওয়া হয়নি।');
      }
      return;
    }
    
    // Permission granted - start camera if we're still initializing or on permission screen
    if (cameraPermission === 'granted' && (status === 'initializing' || status === 'permission')) {
      startCameraFlow();
    }
  }, [open, modelsReady, cameraPermission, status]);

  const startCameraFlow = async () => {
    setStatus('ready');
    setCapturedImage(null);
    setFaceDetected(false);
    await startCamera();
  };

  // Live face detection loop
  useEffect(() => {
    if (status === 'ready' && isActive && videoRef.current && modelsReady) {
      // Start face detection loop
      const startDetectionLoop = () => {
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
        }

        faceDetectionIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          
          const video = videoRef.current;
          if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            return;
          }

          try {
            const detection = await detectFace(video);
            setFaceDetected(!!detection);
          } catch (error) {
            console.error('Face detection error:', error);
            setFaceDetected(false);
          }
        }, 300); // Check every 300ms
      };

      // Small delay to let video stabilize
      const timeout = setTimeout(startDetectionLoop, 500);

      return () => {
        clearTimeout(timeout);
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
          faceDetectionIntervalRef.current = null;
        }
      };
    }

    // Cleanup when not in ready state
    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    };
  }, [status, isActive, modelsReady]);

  const requestCameraPermission = async () => {
    setErrorMessage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      startCameraFlow();
    } catch (error) {
      console.error('Camera permission error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          setErrorMessage('ক্যামেরা অ্যাক্সেস অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।');
        } else {
          setErrorMessage('ক্যামেরা চালু করতে সমস্যা হয়েছে।');
        }
      }
    }
  };

  // Start capture with countdown
  const startCapture = () => {
    setStatus('capturing');
    setCountdown(3);
    
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          // Capture the image after countdown (just capture, don't verify yet)
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Capture image from video
  const capturePhoto = () => {
    if (!videoRef.current) {
      setErrorMessage('ক্যামেরা প্রস্তুত নয়');
      setStatus('failed');
      return;
    }

    const video = videoRef.current;
    
    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setErrorMessage('ছবি ক্যাপচার করতে সমস্যা হয়েছে');
      setStatus('failed');
      return;
    }
    
    // Draw mirrored image (since video is mirrored with scaleX(-1))
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    // Get the captured image as data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    
    // Show captured image for review
    setStatus('captured');
  };

  // Retake photo
  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setStatus('ready');
  };

  // Confirm and verify the captured photo
  const confirmAndVerify = async () => {
    if (!videoRef.current || !idCardImageUrl) {
      setErrorMessage('ক্যামেরা বা আইডি কার্ড ইমেজ প্রস্তুত নয়');
      setStatus('failed');
      return;
    }

    setStatus('processing');
    setProgress(0);
    setErrorMessage(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 3, 90));
    }, 100);

    try {
      const result: FaceVerificationResult = await verifyFaceAgainstImage(
        videoRef.current,
        idCardImageUrl
      );

      clearInterval(progressInterval);
      setProgress(100);
      setSimilarity(result.similarity);

      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          cleanup();
          onVerificationComplete();
        }, 1500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setErrorMessage(result.message);

        if (newAttempts >= maxAttempts) {
          setStatus('failed');
          setTimeout(() => {
            cleanup();
            onVerificationFailed();
          }, 2000);
        } else {
          setStatus('failed');
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Face verification error:', error);
      setErrorMessage('যাচাই করতে সমস্যা হয়েছে');
      setStatus('failed');
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setTimeout(() => {
          cleanup();
          onVerificationFailed();
        }, 2000);
      }
    }
  };

  const cleanup = useCallback(() => {
    stopCamera();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    setStatus('initializing');
    setProgress(0);
    setAttempts(0);
    setSimilarity(0);
    setErrorMessage(null);
    setCameraPermission('checking');
    setCapturedImage(null);
    setCountdown(null);
    setFaceDetected(false);
    // Note: Don't reset modelsReady as models stay loaded
  }, [stopCamera]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      cleanup();
    }
  }, [open, cleanup]);

  const handleRetry = () => {
    if (attempts < maxAttempts) {
      setCapturedImage(null);
      setStatus('ready');
      setProgress(0);
      setErrorMessage(null);
      setCountdown(null);
      setFaceDetected(false);
    }
  };

  const handleClose = () => {
    if (status !== 'capturing' && status !== 'processing') {
      cleanup();
      onVerificationFailed();
    }
  };

  const isProcessing = status === 'capturing' || status === 'processing';
  const showCapturedPreview = status === 'captured' && capturedImage;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Shield className="size-4 sm:size-5 text-primary" />
            ধাপ ২: ফেস স্ক্যান যাচাই
          </DialogTitle>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {status === 'initializing' ? (
            <motion.div
              key="initializing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="size-16 sm:size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ScanFace className="size-8 sm:size-10 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium mb-2">
                ফেস ডিটেকশন মডেল লোড হচ্ছে...
              </p>
              {modelLoadProgress && (
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>মডেল {modelLoadProgress.current + 1}/{modelLoadProgress.total}</span>
                    <span>{Math.round(((modelLoadProgress.current) / modelLoadProgress.total) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(modelLoadProgress.current / modelLoadProgress.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    প্রথমবার লোড হতে কিছুটা সময় লাগতে পারে...
                  </p>
                </div>
              )}
              {!modelLoadProgress && (
                <div className="flex justify-center">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ) : status === 'permission' ? (
            <motion.div
              key="permission"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-4 sm:py-6"
            >
              {/* Permission Request UI */}
              <div className="text-center mb-6">
                <div className={cn(
                  "size-16 sm:size-20 rounded-full flex items-center justify-center mx-auto mb-4",
                  cameraPermission === 'denied' ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  {cameraPermission === 'denied' ? (
                    <VideoOff className="size-8 sm:size-10 text-destructive" />
                  ) : (
                    <Video className="size-8 sm:size-10 text-primary" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  {cameraPermission === 'denied' 
                    ? 'ক্যামেরা অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে' 
                    : 'ক্যামেরা অ্যাক্সেস প্রয়োজন'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {cameraPermission === 'denied' 
                    ? 'ফেস যাচাই করতে ক্যামেরা প্রয়োজন। ব্রাউজার সেটিংস থেকে ক্যামেরা অনুমতি দিন।'
                    : 'আপনার পরিচয় যাচাই করতে আমাদের আপনার ক্যামেরা অ্যাক্সেস করতে হবে। আপনার ছবি নিরাপদ থাকবে।'}
                </p>
              </div>

              {/* What we'll do section */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  যাচাই প্রক্রিয়া
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Camera className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>আপনার ছবি ক্যাপচার করা হবে</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ScanFace className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>আইডি কার্ডের সাথে চেহারা মিলানো হবে</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="size-4 text-success shrink-0 mt-0.5" />
                    <span>সফল হলে অ্যাডমিন প্যানেলে প্রবেশ</span>
                  </li>
                </ul>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-destructive">{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { cleanup(); onVerificationFailed(); }}
                >
                  বাতিল করুন
                </Button>
                {cameraPermission === 'denied' ? (
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => {
                      setErrorMessage('ব্রাউজারের অ্যাড্রেস বারের পাশের 🔒 আইকনে ক্লিক করে ক্যামেরা অনুমতি দিন, তারপর পেজ রিফ্রেশ করুন।');
                    }}
                  >
                    <Info className="size-4 mr-2" />
                    কিভাবে অনুমতি দিব?
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={requestCameraPermission}
                  >
                    <Camera className="size-4 mr-2" />
                    ক্যামেরা চালু করুন
                  </Button>
                )}
              </div>
            </motion.div>
          ) : status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="size-14 sm:size-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-7 sm:size-10 text-success" />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-2 text-success">ফেস যাচাই সফল!</h3>
              {idCardData && (
                <p className="text-sm text-muted-foreground mb-2">
                  স্বাগতম, <strong>{idCardData.fullName}</strong>
                </p>
              )}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-2">
                <span>
                  সাদৃশ্য: <strong className="text-success">{similarity}%</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                অ্যাডমিন প্যানেলে নিয়ে যাওয়া হচ্ছে...
              </p>
              <div className="flex justify-center mt-3">
                <div className="animate-spin size-5 sm:size-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            </motion.div>
          ) : status === 'failed' && attempts >= maxAttempts ? (
            <motion.div
              key="max-failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="size-14 sm:size-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-7 sm:size-10 text-destructive" />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-2 text-destructive">যাচাই ব্যর্থ</h3>
              <p className="text-sm text-muted-foreground mb-2">
                সর্বোচ্চ চেষ্টার সংখ্যা ({maxAttempts}) অতিক্রম করেছে।
              </p>
              {errorMessage && (
                <p className="text-xs text-muted-foreground mb-2">{errorMessage}</p>
              )}
              <p className="text-xs text-muted-foreground">
                নিরাপত্তার জন্য আপনাকে লগ আউট করা হচ্ছে...
              </p>
            </motion.div>
          ) : status === 'failed' ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="size-14 sm:size-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-7 sm:size-10 text-destructive" />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-2 text-destructive">মিল হয়নি</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {errorMessage || 'চেহারা আইডি কার্ডের সাথে মেলেনি।'}
              </p>
              {similarity > 0 && (
                <p className="text-xs text-muted-foreground mb-2">
                  সাদৃশ্য স্কোর: {similarity}% (ন্যূনতম প্রয়োজন: ৫৫%)
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-6">
                চেষ্টা বাকি: {maxAttempts - attempts}
              </p>
              <div className="flex gap-2 sm:gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => { cleanup(); onVerificationFailed(); }}>
                  বাতিল করুন
                </Button>
                <Button size="sm" onClick={handleRetry}>
                  <RotateCcw className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                  আবার চেষ্টা করুন
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Camera Error */}
              {cameraError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-destructive">{cameraError}</span>
                  </div>
                </div>
              )}

              {/* Matched ID Info */}
              {idCardData && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="size-3.5 sm:size-4 text-success shrink-0" />
                    <span className="text-success font-medium">আইডি কার্ড যাচাই সম্পন্ন:</span>
                    <span className="text-foreground truncate">{idCardData.fullName}</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {status === 'ready' && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="size-3.5 sm:size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      ক্যামেরার সামনে আপনার চেহারা রাখুন এবং "ছবি তুলুন" বাটনে ক্লিক করুন।
                    </p>
                  </div>
                </div>
              )}

              {/* Captured preview info */}
              {showCapturedPreview && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="size-3.5 sm:size-4 text-success shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      ছবি তোলা হয়েছে। ছবি ঠিক থাকলে "যাচাই করুন" বাটনে ক্লিক করুন অথবা পুনরায় তুলুন।
                    </p>
                  </div>
                </div>
              )}

              {/* Processing info */}
              {status === 'processing' && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2">
                    <Loader2 className="size-3.5 sm:size-4 text-primary shrink-0 mt-0.5 animate-spin" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      চেহারা আইডি কার্ডের সাথে মেলানো হচ্ছে...
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Preview */}
              <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-3 sm:mb-4">
                {/* Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    capturedImage && "hidden"
                  )}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Captured Image */}
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Camera not active overlay */}
                {!isActive && !cameraError && !capturedImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <Camera className="size-10 sm:size-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">ক্যামেরা চালু হচ্ছে...</p>
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-2 z-10">
                  {/* LIVE indicator */}
                  {isActive && !capturedImage && (
                    <div className="bg-destructive text-destructive-foreground px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
                      <span className="size-1 sm:size-1.5 bg-destructive-foreground rounded-full animate-pulse" />
                      LIVE
                    </div>
                  )}
                  
                  {/* Face detection indicator */}
                  {status === 'ready' && isActive && !capturedImage && (
                    <div className={cn(
                      "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 transition-colors",
                      faceDetected 
                        ? "bg-success/90 text-white" 
                        : "bg-amber-500/90 text-white"
                    )}>
                      <ScanFace className="size-3" />
                      {faceDetected ? 'চেহারা পাওয়া গেছে' : 'চেহারা খুঁজছে...'}
                    </div>
                  )}
                </div>

                {/* Attempts counter */}
                {attempts > 0 && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-amber-500/90 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium z-10">
                    চেষ্টা: {attempts}/{maxAttempts}
                  </div>
                )}

                {/* Face guide frame */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
                  {status === 'processing' && (
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </div>

                {/* Face oval guide */}
                {status === 'ready' && isActive && !capturedImage && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={cn(
                      "w-24 h-32 sm:w-32 sm:h-40 border-2 rounded-[40%] transition-colors duration-300",
                      faceDetected ? "border-success" : "border-primary/40 animate-pulse"
                    )} />
                  </div>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-6xl sm:text-8xl font-bold text-primary"
                    >
                      {countdown}
                    </motion.div>
                  </div>
                )}

                {/* Processing overlay */}
                {status === 'processing' && (
                  <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
                    <div className="text-center text-white drop-shadow-lg">
                      <ScanFace className="size-10 sm:size-14 mx-auto mb-2 text-primary animate-pulse" />
                      <p className="text-xs sm:text-sm font-medium">চেহারা যাচাই হচ্ছে...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress - only during processing */}
              {status === 'processing' && (
                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                    <span className="text-muted-foreground">ফেস ম্যাচিং</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 sm:h-2" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 sm:gap-3">
                {showCapturedPreview ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={handleRetakePhoto}
                    >
                      <RotateCcw className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                      পুনরায় তুলুন
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={confirmAndVerify}
                      disabled={!idCardImageUrl}
                    >
                      <CheckCircle className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                      যাচাই করুন
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => { cleanup(); onVerificationFailed(); }}
                      disabled={isProcessing}
                    >
                      বাতিল করুন
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={startCapture}
                      disabled={isProcessing || !isActive || !idCardImageUrl}
                    >
                      {status === 'processing' ? (
                        <>
                          <Loader2 className="size-3 sm:size-4 mr-1.5 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">যাচাই হচ্ছে...</span>
                          <span className="sm:hidden">যাচাই...</span>
                        </>
                      ) : status === 'capturing' ? (
                        <>
                          <Camera className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">ছবি তোলা হচ্ছে...</span>
                          <span className="sm:hidden">তোলা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">ছবি তুলুন</span>
                          <span className="sm:hidden">ছবি তুলুন</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
