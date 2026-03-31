import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, User, Loader2 } from 'lucide-react';
import { Candidate, uploadCandidatePhoto, createCandidate, updateCandidate } from '@/hooks/use-candidates';

interface CandidateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: Candidate | null;
  onSuccess: () => void;
}

export function CandidateFormDialog({ open, onOpenChange, candidate, onSuccess }: CandidateFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(candidate?.photo_url || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: candidate?.full_name || '',
    position: candidate?.position || '',
    party: candidate?.party || '',
    manifesto: candidate?.manifesto || '',
  });

  const isEditing = !!candidate;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.position.trim()) {
      toast.error('নাম ও পদবী আবশ্যক');
      return;
    }

    setIsLoading(true);
    try {
      let photo_url = candidate?.photo_url;

      // Upload new photo if provided
      if (photoFile) {
        photo_url = await uploadCandidatePhoto(photoFile);
      }

      const candidateData = {
        full_name: formData.full_name.trim(),
        position: formData.position.trim(),
        party: formData.party.trim() || null,
        manifesto: formData.manifesto.trim() || null,
        photo_url,
      };

      if (isEditing && candidate) {
        await updateCandidate(candidate.id, candidateData);
        toast.success('প্রার্থী আপডেট হয়েছে');
      } else {
        await createCandidate(candidateData);
        toast.success('প্রার্থী যোগ হয়েছে');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'প্রার্থী সম্পাদনা' : 'নতুন প্রার্থী যোগ করুন'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>ছবি</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <input {...getInputProps()} />
              {photoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="size-20 rounded-full object-cover"
                  />
                  <span className="text-xs text-muted-foreground">ক্লিক করে পরিবর্তন করুন</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Upload className="size-4 inline mr-1" />
                    ছবি আপলোড করুন
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">পুরো নাম *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="প্রার্থীর পুরো নাম"
              required
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">পদবী *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="যেমন: সভাপতি, সাধারণ সম্পাদক"
              required
            />
          </div>

          {/* Party */}
          <div className="space-y-2">
            <Label htmlFor="party">দল / প্যানেল</Label>
            <Input
              id="party"
              value={formData.party}
              onChange={(e) => setFormData(prev => ({ ...prev, party: e.target.value }))}
              placeholder="দল বা প্যানেলের নাম (ঐচ্ছিক)"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="manifesto">সংক্ষিপ্ত পরিচিতি</Label>
            <Textarea
              id="manifesto"
              value={formData.manifesto}
              onChange={(e) => setFormData(prev => ({ ...prev, manifesto: e.target.value }))}
              placeholder="প্রার্থী সম্পর্কে সংক্ষেপে..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              {isEditing ? 'আপডেট করুন' : 'যোগ করুন'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
