import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VoterUploadZone } from '@/components/admin/VoterUploadZone';
import { VoterPreviewTable, ProcessedVoter } from '@/components/admin/VoterPreviewTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { extractIdCardData, terminateOCR } from '@/lib/ocr';

import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

export default function AdminUpload() {
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processedVoters, setProcessedVoters] = useState<ProcessedVoter[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; failed: number } | null>(null);

  // Cleanup OCR workers on unmount
  useEffect(() => {
    return () => {
      terminateOCR();
    };
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(true);
    setSaveResult(null);
    setProcessingProgress(0);

    const newVoters: ProcessedVoter[] = [];
    const totalFiles = newFiles.length;
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileItem = newFiles[i];
      try {
        const extractedData = await extractIdCardData(fileItem.file);

        newVoters.push({
          id: fileItem.id,
          voterId: extractedData.voterId,
          fullName: extractedData.fullName,
          photoUrl: fileItem.preview,
          confidence: extractedData.confidence,
          hasError: !extractedData.voterId || !extractedData.fullName,
        });
      } catch (error) {
        console.error('OCR Error:', error);
        toast.error(`ছবি প্রসেসিং ব্যর্থ: ${fileItem.file.name}`);
      }
      setProcessingProgress(((i + 1) / totalFiles) * 100);
    }

    setProcessedVoters(prev => [...prev, ...newVoters]);
    setIsProcessing(false);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview); // Cleanup blob URL
      return prev.filter(f => f.id !== id);
    });
    setProcessedVoters(prev => prev.filter(v => v.id !== id));
  }, []);

  const handleUpdateVoter = useCallback((id: string, data: Partial<ProcessedVoter>) => {
    setProcessedVoters(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, ...data };
        updated.hasError = !updated.voterId || !updated.fullName;
        return updated;
      }
      return v;
    }));
  }, []);

  const handleToggleEdit = useCallback((id: string) => {
    setProcessedVoters(prev => prev.map(v => 
      v.id === id ? { ...v, isEditing: !v.isEditing } : v
    ));
  }, []);

  const handleSaveToDatabase = useCallback(async () => {
    const validVoters = processedVoters.filter(v => v.voterId && v.fullName);
    
    if (validVoters.length === 0) {
      toast.error('সেভ করার মতো কোনো বৈধ ভোটার নেই');
      return;
    }

    setIsSaving(true);
    setSaveResult(null);
    
    let success = 0;
    let failed = 0;

    // Batch insert for better performance
    const votersToInsert = [];
    
    for (const voter of validVoters) {
      try {
        const fileItem = uploadedFiles.find(f => f.id === voter.id);
        let photoUrl = '';
        
        if (fileItem) {
          const fileName = `${voter.voterId}-${Date.now()}.jpg`;
          const { data: storageData, error: storageError } = await supabase.storage
            .from('id-cards')
            .upload(`voters/${fileName}`, fileItem.file);

          if (!storageError && storageData) {
            photoUrl = storageData.path;
          }
        }

        votersToInsert.push({
          voter_id: voter.voterId,
          full_name: voter.fullName,
          photo_url: photoUrl,
          is_verified: false,
        });
      } catch (error) {
        console.error('Prepare error:', error);
        failed++;
      }
    }

    // Batch insert
    if (votersToInsert.length > 0) {
      const { data, error } = await supabase
        .from('voters')
        .insert(votersToInsert)
        .select();

      if (error) {
        if (error.code === '23505') {
          toast.error('ডুপ্লিকেট আইডি পাওয়া গেছে');
        }
        failed += votersToInsert.length;
      } else {
        success = data?.length || 0;
      }
    }

    setIsSaving(false);
    setSaveResult({ success, failed });

    if (success > 0) {
      toast.success(`${success}টি ভোটার সফলভাবে সেভ হয়েছে`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['voter-stats'] });
      
      // Clear saved voters
      const savedIds = validVoters.map(v => v.id);
      setProcessedVoters(prev => prev.filter(v => !savedIds.includes(v.id)));
      setUploadedFiles(prev => {
        prev.filter(f => savedIds.includes(f.id)).forEach(f => URL.revokeObjectURL(f.preview));
        return prev.filter(f => !savedIds.includes(f.id));
      });
    }

    if (failed > 0) {
      toast.error(`${failed}টি ভোটার সেভ করতে ব্যর্থ`);
    }
  }, [processedVoters, uploadedFiles, queryClient]);

  const { validCount, errorCount } = useMemo(() => ({
    validCount: processedVoters.filter(v => v.voterId && v.fullName).length,
    errorCount: processedVoters.filter(v => !v.voterId || !v.fullName).length,
  }), [processedVoters]);

  const headerActions = processedVoters.length > 0 ? (
    <Button 
      onClick={handleSaveToDatabase}
      disabled={isSaving || validCount === 0}
      className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
      size="sm"
    >
      {isSaving ? (
        <Loader2 className="size-3.5 sm:size-4 animate-spin" />
      ) : (
        <Save className="size-3.5 sm:size-4" />
      )}
      <span className="hidden sm:inline">ডাটাবেসে সেভ করুন</span>
      <span className="sm:hidden">সেভ</span>
      <span>({validCount})</span>
    </Button>
  ) : undefined;

  return (
    <AdminLayout
      title="ভোটার আপলোড"
      subtitle="আইডি কার্ড থেকে স্বয়ংক্রিয়ভাবে ভোটার তথ্য সংগ্রহ"
      actions={headerActions}
    >
      {/* Upload Zone */}
      <Card className="border-border">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">আইডি কার্ড আপলোড</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            আইডি কার্ডের ছবি আপলোড করুন। OCR প্রযুক্তি ব্যবহার করে নাম ও আইডি স্বয়ংক্রিয়ভাবে সনাক্ত হবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <VoterUploadZone
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {saveResult && (
        <Alert className={cn(
          "text-xs sm:text-sm",
          saveResult.failed > 0 
            ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20" 
            : "border-green-500/50 bg-green-50 dark:bg-green-950/20"
        )}>
          <CheckCircle2 className="size-3.5 sm:size-4" />
          <AlertDescription>
            {saveResult.success}টি সফল, {saveResult.failed}টি ব্যর্থ
          </AlertDescription>
        </Alert>
      )}

      {errorCount > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 text-xs sm:text-sm">
          <AlertTriangle className="size-3.5 sm:size-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {errorCount}টি ভোটারের তথ্য সম্পূর্ণ নয়। ম্যানুয়ালি এডিট করুন।
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {(processedVoters.length > 0 || isProcessing) && (
        <Card className="border-border">
          <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center justify-between flex-wrap gap-2 text-base sm:text-lg">
              <span>প্রসেসকৃত ভোটার</span>
              {processedVoters.length > 0 && (
                <span className="text-[10px] sm:text-xs md:text-sm font-normal text-muted-foreground">
                  মোট: {processedVoters.length} | বৈধ: {validCount} | ত্রুটি: {errorCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <VoterPreviewTable
              voters={processedVoters}
              onUpdate={handleUpdateVoter}
              onRemove={handleRemoveFile}
              onToggleEdit={handleToggleEdit}
            />
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
