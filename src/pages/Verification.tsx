import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ScanFace, CheckCircle, Camera, RotateCcw, HelpCircle, Info, Loader2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { useCamera } from "@/hooks/use-camera";
import { extractIdCardData, ExtractedData, terminateOCR } from "@/lib/ocr";
import { loadFaceModels, detectFace, getFaceDescriptor, compareFaces, captureFrameFromVideo } from "@/lib/face-verification";
import { LivenessDetector, getChallengeInstruction, getChallengeIcon } from "@/lib/liveness-detection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = 'id-scan' | 'face-scan' | 'complete';

const steps = [
  { id: 'id-scan' as const, label: 'আইডি কার্ড স্ক্যান', icon: CreditCard, subtitle: 'ধাপ ১' },
  { id: 'face-scan' as const, label: 'ফেস রিকগনিশন', icon: ScanFace, subtitle: 'ধাপ ২' },
  { id: 'complete' as const, label: 'যাচাইকরণ সম্পন্ন', icon: CheckCircle, subtitle: 'ধাপ ৩' },
];

export default function Verification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('id-scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [voterData, setVoterData] = useState<any>(null);
  const [faceMatchProgress, setFaceMatchProgress] = useState(0);
  const [livenessMessage, setLivenessMessage] = useState('');
  const [livenessEmoji, setLivenessEmoji] = useState('');
  const [modelsReady, setModelsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; similarity: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const livenessRef = useRef<LivenessDetector>(new LivenessDetector());
  const animFrameRef = useRef<number>(0);

  // Camera for ID scan (rear camera)
  const idCamera = useCamera({ facingMode: 'environment', width: 1280, height: 720 });
  // Camera for face scan (front camera)
  const faceCamera = useCamera({ facingMode: 'user', width: 640, height: 480 });

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  // Preload face models when entering face-scan step
  useEffect(() => {
    if (currentStep === 'face-scan' || currentStep === 'id-scan') {
      loadFaceModels()
        .then(() => setModelsReady(true))
        .catch(() => console.warn('Face models preload failed'));
    }
  }, [currentStep]);

  // Start camera based on current step
  useEffect(() => {
    if (currentStep === 'id-scan') {
      idCamera.startCamera();
    } else if (currentStep === 'face-scan') {
      idCamera.stopCamera();
      faceCamera.startCamera();
    } else {
      idCamera.stopCamera();
      faceCamera.stopCamera();
    }
    
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      idCamera.stopCamera();
      faceCamera.stopCamera();
      cancelAnimationFrame(animFrameRef.current);
      terminateOCR();
    };
  }, []);

  // Capture photo from camera for ID scan
  const captureIdCard = useCallback(async () => {
    if (!idCamera.videoRef.current || !idCamera.isActive) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    setOcrProgress(10);
    
    try {
      const video = idCamera.videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.drawImage(video, 0, 0);
      
      setOcrProgress(30);
      
      // Convert to file for OCR
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Blob creation failed')), 'image/jpeg', 0.9);
      });
      const file = new File([blob], 'id-card.jpg', { type: 'image/jpeg' });
      
      setOcrProgress(50);
      
      // Run OCR
      const data = await extractIdCardData(file);
      setOcrProgress(80);
      
      if (!data.voterId) {
        setErrorMessage('আইডি কার্ড থেকে ভোটার আইডি খুঁজে পাওয়া যায়নি। পরিষ্কার ছবি তুলুন।');
        setOcrProgress(0);
        setIsProcessing(false);
        return;
      }
      
      setExtractedData(data);
      
      // Look up voter in database
      const { data: voter, error } = await supabase
        .from('voters')
        .select('*')
        .eq('voter_id', data.voterId)
        .maybeSingle();
      
      setOcrProgress(100);
      
      if (error || !voter) {
        setErrorMessage(`ভোটার আইডি "${data.voterId}" ডাটাবেসে পাওয়া যায়নি।`);
        setIsProcessing(false);
        return;
      }
      
      if (voter.has_voted) {
        setErrorMessage('আপনি ইতিমধ্যে ভোট দিয়েছেন। একাধিক ভোট অনুমোদিত নয়।');
        setIsProcessing(false);
        return;
      }
      
      setVoterData(voter);
      
      toast({
        title: 'আইডি কার্ড যাচাই সফল',
        description: `${data.fullName || voter.full_name} - আইডি: ${data.voterId}`,
      });
      
      // Move to face scan step
      setTimeout(() => {
        setCurrentStep('face-scan');
        setIsProcessing(false);
        setOcrProgress(0);
      }, 1000);
      
    } catch (err) {
      console.error('ID scan error:', err);
      setErrorMessage('আইডি কার্ড স্ক্যান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [idCamera.videoRef, idCamera.isActive, toast]);

  // Upload ID card image from file
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    setOcrProgress(20);
    
    try {
      const data = await extractIdCardData(file);
      setOcrProgress(70);
      
      if (!data.voterId) {
        setErrorMessage('আইডি কার্ড থেকে ভোটার আইডি খুঁজে পাওয়া যায়নি।');
        setOcrProgress(0);
        setIsProcessing(false);
        return;
      }
      
      setExtractedData(data);
      
      const { data: voter, error } = await supabase
        .from('voters')
        .select('*')
        .eq('voter_id', data.voterId)
        .maybeSingle();
      
      setOcrProgress(100);
      
      if (error || !voter) {
        setErrorMessage(`ভোটার আইডি "${data.voterId}" ডাটাবেসে পাওয়া যায়নি।`);
        setIsProcessing(false);
        return;
      }
      
      if (voter.has_voted) {
        setErrorMessage('আপনি ইতিমধ্যে ভোট দিয়েছেন।');
        setIsProcessing(false);
        return;
      }
      
      setVoterData(voter);
      toast({
        title: 'আইডি কার্ড যাচাই সফল',
        description: `${data.fullName || voter.full_name} - আইডি: ${data.voterId}`,
      });
      
      setTimeout(() => {
        setCurrentStep('face-scan');
        setIsProcessing(false);
        setOcrProgress(0);
      }, 1000);
    } catch {
      setErrorMessage('ফাইল প্রসেস করতে সমস্যা হয়েছে।');
      setIsProcessing(false);
      setOcrProgress(0);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [toast]);

  // Start face verification with liveness detection
  const startFaceVerification = useCallback(async () => {
    if (!faceCamera.videoRef.current || !faceCamera.isActive || !modelsReady) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    setFaceMatchProgress(0);
    setVerificationResult(null);
    
    const detector = livenessRef.current;
    detector.reset();
    
    const video = faceCamera.videoRef.current;
    
    const processFrame = async () => {
      if (!faceCamera.isActive) return;
      
      try {
        const detection = await detectFace(video);
        
        if (!detection) {
          setLivenessMessage('চেহারা খুঁজে পাওয়া যাচ্ছে না। ক্যামেরার দিকে তাকান।');
          setLivenessEmoji('👤');
          animFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }
        
        const state = await detector.processFrame(detection);
        
        setLivenessMessage(state.message);
        setFaceMatchProgress(state.progress);
        
        const challenge = detector.getCurrentChallenge();
        if (challenge) {
          setLivenessEmoji(getChallengeIcon(challenge));
        }
        
        if (state.isLive) {
          // Liveness passed! Now do face matching
          setLivenessMessage('লাইভনেস যাচাই সম্পন্ন! চেহারা ম্যাচ করা হচ্ছে...');
          setFaceMatchProgress(80);
          
          // Get face descriptor from live video
          const canvas = await captureFrameFromVideo(video);
          const liveDescriptor = await getFaceDescriptor(canvas);
          
          if (!liveDescriptor) {
            setErrorMessage('চেহারার বৈশিষ্ট্য বের করা যায়নি। আবার চেষ্টা করুন।');
            setIsProcessing(false);
            return;
          }
          
          // If voter has a face template stored, compare
          if (voterData?.face_template) {
            try {
              const storedDescriptor = new Float32Array(JSON.parse(voterData.face_template));
              const similarity = compareFaces(liveDescriptor, storedDescriptor);
              
              setFaceMatchProgress(100);
              setVerificationResult({ success: similarity >= 55, similarity: Math.round(similarity) });
              
              if (similarity >= 55) {
                await markVoterVerified();
              } else {
                setErrorMessage(`চেহারা মেলেনি (${Math.round(similarity)}% সাদৃশ্য)। আবার চেষ্টা করুন।`);
                setIsProcessing(false);
              }
            } catch {
              // If face template parsing fails, skip matching and verify
              await markVoterVerified();
            }
          } else {
            // No stored face template - store this one and verify
            const descriptorJson = JSON.stringify(Array.from(liveDescriptor));
            await supabase
              .from('voters')
              .update({ face_template: descriptorJson, is_verified: true })
              .eq('id', voterData.id);
            
            setFaceMatchProgress(100);
            setVerificationResult({ success: true, similarity: 100 });
            
            toast({
              title: 'ফেস টেমপ্লেট সংরক্ষণ করা হয়েছে',
              description: 'প্রথমবার যাচাই — আপনার চেহারা সংরক্ষিত হয়েছে।',
            });
            
            completeVerification();
          }
          
          return; // Stop the animation frame loop
        }
        
        // Check timeout
        if (detector.isChallengeTimedOut()) {
          setErrorMessage('সময় শেষ! আবার চেষ্টা করুন।');
          setIsProcessing(false);
          return;
        }
        
        animFrameRef.current = requestAnimationFrame(processFrame);
      } catch (err) {
        console.error('Frame processing error:', err);
        animFrameRef.current = requestAnimationFrame(processFrame);
      }
    };
    
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [faceCamera.videoRef, faceCamera.isActive, modelsReady, voterData, toast]);

  const markVoterVerified = async () => {
    if (!voterData) return;
    await supabase
      .from('voters')
      .update({ is_verified: true })
      .eq('id', voterData.id);
    completeVerification();
  };

  const completeVerification = () => {
    setIsProcessing(false);
    setCurrentStep('complete');
    
    // Store verified voter info for Ballot and Dashboard pages
    if (voterData) {
      sessionStorage.setItem('verified_voter_id', voterData.id);
      sessionStorage.setItem('verified_voter_name', voterData.full_name);
    }
    
    toast({
      title: 'যাচাইকরণ সফল! ✅',
      description: 'আপনি এখন ভোট দিতে পারবেন।',
    });
    
    setTimeout(() => navigate('/ballot'), 2500);
  };

  const handleRetry = () => {
    setIsProcessing(false);
    setErrorMessage(null);
    setOcrProgress(0);
    setFaceMatchProgress(0);
    setVerificationResult(null);
    livenessRef.current.reset();
    cancelAnimationFrame(animFrameRef.current);
  };

  const activeCamera = currentStep === 'id-scan' ? idCamera : faceCamera;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="flex-1 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            <span className="text-primary">BD Vote</span>
            <span className="mx-2">/</span>
            <span>আইডেন্টিটি যাচাইকরণ</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2">আইডেন্টিটি যাচাইকরণ</h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                AI ও ব্লকচেইন প্রযুক্তির মাধ্যমে আপনার পরিচয় নিশ্চিত করুন
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground self-start text-xs sm:text-sm">
              <HelpCircle className="size-3 sm:size-4 mr-1 sm:mr-2" />
              সাহায্য নিন
            </Button>
          </div>

          {/* Progress Bar */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 sm:size-5 text-primary" />
                  <span className="font-medium text-sm sm:text-base">পরিচয় যাচাইকরণ</span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">ধাপ {currentStepIndex + 1} / {steps.length}</span>
              </div>
              <Progress value={progressPercent} className="h-1.5 sm:h-2" />
              {extractedData && voterData && (
                <p className="text-xs sm:text-sm text-success mt-2">
                  ✅ {voterData.full_name} (আইডি: {extractedData.voterId})
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Steps Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile: Horizontal Steps */}
                  <div className="flex lg:hidden items-center justify-between mb-4">
                    {steps.map((step, index) => {
                      const isActive = step.id === currentStep;
                      const isComplete = index < currentStepIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.id} className="flex flex-col items-center flex-1">
                          <div className={cn(
                            "size-10 sm:size-12 rounded-full flex items-center justify-center mb-2",
                            isComplete ? "bg-success text-success-foreground" :
                            isActive ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? <CheckCircle className="size-5 sm:size-6" /> : <StepIcon className="size-5 sm:size-6" />}
                          </div>
                          <p className={cn(
                            "text-[10px] sm:text-xs font-medium text-center",
                            isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: Vertical Steps */}
                  <div className="hidden lg:block space-y-6">
                    {steps.map((step, index) => {
                      const isActive = step.id === currentStep;
                      const isComplete = index < currentStepIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.id} className="flex items-start gap-4">
                          <div className={cn(
                            "size-10 rounded-full flex items-center justify-center shrink-0",
                            isComplete ? "bg-success text-success-foreground" :
                            isActive ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isComplete ? <CheckCircle className="size-5" /> : <StepIcon className="size-5" />}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium",
                              isActive ? "text-primary" : isComplete ? "text-success" : "text-muted-foreground"
                            )}>{step.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {isActive ? 'চলমান ধাপ' : step.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Instructions */}
                  <div className="pt-4 border-t border-border mt-4 lg:mt-0">
                    <div className="flex items-center gap-2 text-primary mb-2 sm:mb-3">
                      <Info className="size-3 sm:size-4" />
                      <span className="font-medium text-xs sm:text-sm">নির্দেশনা</span>
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      {currentStep === 'id-scan' ? (
                        <>
                          <li>• আইডি কার্ডটি ক্যামেরার সামনে সমতল রাখুন।</li>
                          <li>• পর্যাপ্ত আলো নিশ্চিত করুন।</li>
                          <li>• কার্ডের লেখা যেন পরিষ্কার দেখা যায়।</li>
                          <li>• ছবি তুলতে না পারলে ফাইল আপলোড করুন।</li>
                        </>
                      ) : (
                        <>
                          <li>• সরাসরি ক্যামেরার দিকে তাকান।</li>
                          <li>• চশমা বা মাস্ক খুলে ফেলুন।</li>
                          <li>• নির্দেশনা অনুযায়ী চোখ পিটপিট করুন ও মাথা ঘোরান।</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <AnimatePresence mode="wait">
                    {currentStep === 'complete' ? (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 sm:py-12"
                      >
                        <div className="size-16 sm:size-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                          <CheckCircle className="size-8 sm:size-10 text-success" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">যাচাইকরণ সফল হয়েছে!</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-2">
                          {voterData?.full_name && <strong>{voterData.full_name}</strong>}
                        </p>
                        {verificationResult && (
                          <Badge className="bg-success/10 text-success border-0 mb-4">
                            {verificationResult.similarity}% ফেস ম্যাচ
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                          আপনাকে ব্যালট পেজে নিয়ে যাওয়া হচ্ছে...
                        </p>
                        <div className="flex justify-center">
                          <div className="animate-spin size-6 sm:size-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key={currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-center mb-4 sm:mb-6 px-2">
                          {currentStep === 'id-scan'
                            ? 'আপনার ইউনিভার্সিটি আইডি কার্ডটি ক্যামেরার সামনে ধরুন'
                            : 'চেহারা যাচাই — নির্দেশনা অনুসরণ করুন'
                          }
                        </h2>

                        {/* Camera Preview */}
                        <div className="relative aspect-[4/3] sm:aspect-video bg-muted rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6">
                          {/* Video element */}
                          <video
                            ref={activeCamera.videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                              "absolute inset-0 w-full h-full object-cover",
                              currentStep === 'face-scan' && "scale-x-[-1]" // Mirror for selfie
                            )}
                          />
                          
                          {/* LIVE badge */}
                          {activeCamera.isActive && (
                            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-destructive text-destructive-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 z-10">
                              <span className="size-1.5 sm:size-2 bg-destructive-foreground rounded-full animate-pulse" />
                              LIVE
                            </div>
                          )}

                          {/* Scan Frame */}
                          <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none" />

                          {/* Liveness instruction overlay */}
                          {currentStep === 'face-scan' && isProcessing && livenessMessage && (
                            <div className="absolute bottom-3 left-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg p-3 z-10 text-center">
                              <span className="text-2xl mr-2">{livenessEmoji}</span>
                              <span className="text-sm font-medium">{livenessMessage}</span>
                            </div>
                          )}

                          {/* Camera not available overlay */}
                          {!activeCamera.isActive && !activeCamera.error && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <div className="text-center text-muted-foreground">
                                <Loader2 className="size-8 sm:size-12 mx-auto mb-2 animate-spin text-primary" />
                                <p className="text-xs sm:text-sm">ক্যামেরা চালু হচ্ছে...</p>
                              </div>
                            </div>
                          )}

                          {/* Camera error */}
                          {activeCamera.error && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <div className="text-center text-destructive px-4">
                                <AlertCircle className="size-8 mx-auto mb-2" />
                                <p className="text-xs sm:text-sm">{activeCamera.error}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                          <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                            <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-destructive">{errorMessage}</p>
                          </div>
                        )}

                        {/* Extracted data preview */}
                        {extractedData && currentStep === 'id-scan' && (
                          <div className="mb-4 bg-success/10 border border-success/20 rounded-lg p-3">
                            <p className="text-xs sm:text-sm text-success font-medium">
                              ✅ আইডি: {extractedData.voterId} | নাম: {extractedData.fullName || 'N/A'} | নির্ভুলতা: {extractedData.confidence.toFixed(0)}%
                            </p>
                          </div>
                        )}

                        {/* Progress */}
                        <div className="mb-4 sm:mb-6">
                          <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                            <span className="text-muted-foreground">
                              {currentStep === 'id-scan' ? 'আইডি ডাটা এক্সট্রাকশন' : 'ফেস ম্যাচিং ও লাইভনেস'}
                            </span>
                            <span className="text-primary font-medium">
                              {currentStep === 'id-scan' ? ocrProgress : faceMatchProgress}% সম্পন্ন
                            </span>
                          </div>
                          <Progress 
                            value={currentStep === 'id-scan' ? ocrProgress : faceMatchProgress} 
                            className="h-1.5 sm:h-2" 
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          {currentStep === 'id-scan' ? (
                            <>
                              <Button
                                className="flex-1 order-1"
                                size="lg"
                                onClick={captureIdCard}
                                disabled={isProcessing || !idCamera.isActive}
                              >
                                {isProcessing ? (
                                  <><Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />OCR প্রসেস হচ্ছে...</>
                                ) : (
                                  <><Camera className="size-4 sm:size-5 mr-2" />ছবি তুলুন</>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 order-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                              >
                                <CreditCard className="size-4 sm:size-5 mr-2" />
                                ফাইল আপলোড
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                className="flex-1 order-1"
                                size="lg"
                                onClick={startFaceVerification}
                                disabled={isProcessing || !faceCamera.isActive || !modelsReady}
                              >
                                {isProcessing ? (
                                  <><Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />যাচাই হচ্ছে...</>
                                ) : !modelsReady ? (
                                  <><Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />মডেল লোড হচ্ছে...</>
                                ) : (
                                  <><ScanFace className="size-4 sm:size-5 mr-2" />ফেস যাচাই শুরু করুন</>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 order-2"
                                onClick={handleRetry}
                                disabled={isProcessing}
                              >
                                <RotateCcw className="size-4 sm:size-5 mr-2" />
                                আবার চেষ্টা করুন
                              </Button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
