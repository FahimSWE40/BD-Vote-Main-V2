import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Upload, CheckCircle, XCircle, Loader2, 
  RotateCcw, Info, Shield, AlertTriangle 
} from 'lucide-react';
import { extractIdCardData, terminateOCR, ExtractedData } from '@/lib/ocr';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AdminIdCardVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationComplete: (data: ExtractedData) => void;
  adminEmail: string;
}

type VerificationStatus = 'idle' | 'uploading' | 'processing' | 'verifying' | 'success' | 'failed' | 'mismatch';

export function AdminIdCardVerification({
  open,
  onOpenChange,
  onVerificationComplete,
  adminEmail,
}: AdminIdCardVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      terminateOCR();
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setProgress(0);
      setExtractedData(null);
      setErrorMessage('');
      setPreviewUrl(null);
    }
  }, [open]);

  const verifyAgainstDatabase = useCallback(async (extractedData: ExtractedData): Promise<{ verified: boolean; reason?: string }> => {
    try {
      // Get current user's metadata
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { verified: false, reason: 'ব্যবহারকারীর তথ্য পাওয়া যায়নি।' };
      }

      const userMetadata = user.user_metadata;
      const storedVoterId = userMetadata?.voter_id;
      const storedFullName = userMetadata?.full_name;

      // Check if metadata exists
      if (!storedVoterId || !storedFullName) {
        return { 
          verified: false, 
          reason: 'আপনার প্রোফাইলে ভোটার আইডি বা নাম নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।' 
        };
      }

      // Compare extracted data with stored data
      const voterIdMatch = extractedData.voterId.toLowerCase().includes(storedVoterId.toLowerCase()) ||
                            storedVoterId.toLowerCase().includes(extractedData.voterId.toLowerCase());
      
      // Flexible name matching (partial match allowed)
      const extractedNameParts = extractedData.fullName.toLowerCase().split(/\s+/);
      const storedNameParts = storedFullName.toLowerCase().split(/\s+/);
      const nameMatch = extractedNameParts.some((part: string) => 
        storedNameParts.some((storedPart: string) => 
          part.length > 2 && storedPart.includes(part) || storedPart.length > 2 && part.includes(storedPart)
        )
      );

      if (!voterIdMatch) {
        return { 
          verified: false, 
          reason: `ভোটার আইডি মিলছে না। আপনার আইডি: ${storedVoterId}, স্ক্যান করা: ${extractedData.voterId}` 
        };
      }

      if (!nameMatch) {
        return { 
          verified: false, 
          reason: `নাম মিলছে না। আপনার নাম: ${storedFullName}, স্ক্যান করা: ${extractedData.fullName}` 
        };
      }

      return { verified: true };
    } catch (error) {
      console.error('Database verification error:', error);
      return { verified: false, reason: 'ডাটাবেস যাচাইয়ে সমস্যা হয়েছে।' };
    }
  }, []);

  const uploadIdCardToStorage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const userId = userData.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `admin/${userId}/${fileName}`;

      // Delete any existing ID card images for this admin
      const { data: existingFiles } = await supabase.storage
        .from('id-cards')
        .list(`admin/${userId}`);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `admin/${userId}/${f.name}`);
        await supabase.storage.from('id-cards').remove(filesToDelete);
      }

      // Upload the new ID card image
      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading ID card:', uploadError);
        return null;
      }

      return filePath;
    } catch (error) {
      console.error('Error in uploadIdCardToStorage:', error);
      return null;
    }
  }, []);

  const processIdCard = useCallback(async (file: File) => {
    setStatus('uploading');
    setProgress(10);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload ID card to storage for face verification later
    setProgress(20);
    const uploadedPath = await uploadIdCardToStorage(file);
    if (!uploadedPath) {
      console.warn('Failed to upload ID card to storage, continuing with OCR');
    }

    setStatus('processing');
    setProgress(30);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 70));
    }, 300);

    try {
      const data = await extractIdCardData(file);
      clearInterval(progressInterval);
      setProgress(80);

      if (data.confidence > 20) {
        // Even with partial data, try to proceed if we have at least some info
        if (data.voterId || data.fullName) {
          setExtractedData(data);
          
          // Verify against database
          setStatus('verifying');
          setProgress(90);
          
          const verification = await verifyAgainstDatabase(data);
          setProgress(100);

          if (verification.verified) {
            setStatus('success');
            
            // Auto proceed after 1.5 seconds
            setTimeout(() => {
              onVerificationComplete(data);
            }, 1500);
          } else {
            setStatus('mismatch');
            setErrorMessage(verification.reason || 'তথ্য মিলছে না।');
          }
        } else {
          setStatus('failed');
          setExtractedData(data); // Store for debug display
          setErrorMessage(`আইডি কার্ড থেকে তথ্য বের করা যায়নি। OCR কনফিডেন্স: ${data.confidence.toFixed(0)}%`);
        }
      } else {
        setStatus('failed');
        setExtractedData(data); // Store for debug display
        setErrorMessage(`OCR কনফিডেন্স অনেক কম: ${data.confidence.toFixed(0)}%। পরিষ্কার ছবি আপলোড করুন।`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('ID card processing error:', error);
      setStatus('failed');
      setErrorMessage('আইডি কার্ড প্রসেস করতে সমস্যা হয়েছে।');
    }
  }, [onVerificationComplete, verifyAgainstDatabase, uploadIdCardToStorage]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processIdCard(file);
    }
  }, [processIdCard]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: status === 'processing' || status === 'uploading' || status === 'verifying',
  });

  const handleRetry = () => {
    setStatus('idle');
    setProgress(0);
    setExtractedData(null);
    setErrorMessage('');
    setPreviewUrl(null);
  };

  const handleClose = () => {
    if (status !== 'processing' && status !== 'uploading' && status !== 'verifying') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="size-5 text-primary" />
            ধাপ ১: আইডি কার্ড যাচাই
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === 'success' && extractedData ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="size-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-success" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-success">আইডি কার্ড যাচাই সফল!</h3>
              <div className="bg-muted rounded-lg p-4 text-left mb-4">
                <p className="text-sm"><strong>নাম:</strong> {extractedData.fullName}</p>
                <p className="text-sm"><strong>আইডি:</strong> {extractedData.voterId}</p>
                <p className="text-xs text-muted-foreground mt-1">কনফিডেন্স: {extractedData.confidence.toFixed(0)}%</p>
              </div>
              <p className="text-sm text-muted-foreground">
                ফেস স্ক্যানে নিয়ে যাওয়া হচ্ছে...
              </p>
              <div className="flex justify-center mt-2">
                <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </motion.div>
          ) : status === 'mismatch' ? (
            <motion.div
              key="mismatch"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="size-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="size-8 text-warning" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-warning">তথ্য মিলছে না</h3>
              <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
              <div className="bg-muted rounded-lg p-3 text-left mb-4 text-xs">
                <p className="font-medium mb-1">স্ক্যান করা তথ্য:</p>
                <p>নাম: {extractedData?.fullName}</p>
                <p>আইডি: {extractedData?.voterId}</p>
              </div>
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
          ) : status === 'failed' ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="size-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-destructive">যাচাই ব্যর্থ</h3>
              <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
              {extractedData && (
                <div className="bg-muted rounded-lg p-3 text-left mb-4 text-xs">
                  <p className="font-medium mb-1">OCR থেকে প্রাপ্ত:</p>
                  <p>নাম: {extractedData.fullName || '(পাওয়া যায়নি)'}</p>
                  <p>আইডি: {extractedData.voterId || '(পাওয়া যায়নি)'}</p>
                  <p className="text-muted-foreground mt-1">কনফিডেন্স: {extractedData.confidence.toFixed(0)}%</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-primary">Raw OCR টেক্সট দেখুন</summary>
                    <pre className="mt-1 text-[10px] whitespace-pre-wrap max-h-24 overflow-y-auto bg-background p-2 rounded">
                      {extractedData.rawText || '(কোনো টেক্সট পাওয়া যায়নি)'}
                    </pre>
                  </details>
                </div>
              )}
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
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    অ্যাডমিন অ্যাক্সেসের জন্য আপনার আইডি কার্ড স্ক্যান করুন। 
                    এটি <strong>{adminEmail}</strong>-এর সাথে মিলানো হবে।
                  </p>
                </div>
              </div>

              {/* Upload Zone */}
              <div
                {...getRootProps()}
                className={cn(
                  "relative aspect-video border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  (status === 'processing' || status === 'uploading' || status === 'verifying') && "pointer-events-none opacity-70"
                )}
              >
                <input {...getInputProps()} />
                
                {previewUrl ? (
                  <img src={previewUrl} alt="ID Card" className="w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="size-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-center mb-1">
                      {isDragActive ? 'এখানে ড্রপ করুন' : 'আইডি কার্ডের ছবি আপলোড করুন'}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      ক্লিক করুন অথবা ছবি ড্র্যাগ করে ছাড়ুন
                    </p>
                  </div>
                )}

                {/* Processing overlay */}
                {(status === 'processing' || status === 'uploading' || status === 'verifying') && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="size-10 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        {status === 'uploading' ? 'আপলোড হচ্ছে...' : 
                         status === 'verifying' ? 'ডাটাবেস যাচাই হচ্ছে...' : 'OCR প্রসেস হচ্ছে...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress */}
              {(status === 'processing' || status === 'uploading' || status === 'verifying') && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">
                      {status === 'verifying' ? 'ডাটাবেস যাচাই' : 'প্রসেসিং'}
                    </span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={status === 'processing' || status === 'uploading' || status === 'verifying'}
                >
                  বাতিল করুন
                </Button>
                <Button
                  className="flex-1"
                  disabled
                >
                  <Upload className="size-4 mr-2" />
                  ছবি নির্বাচন করুন
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
