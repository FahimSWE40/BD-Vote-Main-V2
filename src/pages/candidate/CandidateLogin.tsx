import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Loader2, Eye, EyeOff, LogIn, Info } from 'lucide-react';
import bdVoteLogo from '@/assets/bd-vote-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCandidates } from '@/hooks/use-candidates';
import { useCandidateAuth } from '@/hooks/use-candidate-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CandidateLogin() {
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: candidates, isLoading: loadingCandidates } = useCandidates();
  const { login, isLoading } = useCandidateAuth();

  const activeCandidates = candidates?.filter(c => c.is_active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidateId || !accessCode) {
      toast({
        title: 'তথ্য অসম্পূর্ণ',
        description: 'প্রার্থী নির্বাচন করুন এবং অ্যাক্সেস কোড দিন।',
        variant: 'destructive',
      });
      return;
    }

    const success = await login(selectedCandidateId, accessCode);
    
    if (success) {
      toast({
        title: 'লগইন সফল',
        description: 'প্রার্থী ড্যাশবোর্ডে স্বাগতম!',
      });
      navigate('/candidate');
    } else {
      toast({
        title: 'লগইন ব্যর্থ',
        description: 'ভুল অ্যাক্সেস কোড বা প্রার্থী নির্বাচন করুন।',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <img src={bdVoteLogo} alt="BD Vote" className="h-16 w-auto mx-auto" />
            <div>
              <CardTitle className="text-2xl font-bold">প্রার্থী লগইন</CardTitle>
              <CardDescription className="mt-2">
                আপনার ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন
              </CardDescription>
            </div>

            <Alert className="text-left">
              <Info className="size-4" />
              <AlertDescription className="text-xs">
                এটি শুধুমাত্র-পড়ার ড্যাশবোর্ড। আপনি ভোটার উপস্থিতি ও নির্বাচনের তথ্য দেখতে পারবেন।
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>প্রার্থী নির্বাচন করুন</Label>
                <Select
                  value={selectedCandidateId}
                  onValueChange={setSelectedCandidateId}
                  disabled={loadingCandidates || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCandidates ? 'লোড হচ্ছে...' : 'প্রার্থী বাছাই করুন'} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name} — {c.position} {c.party ? `(${c.party})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>অ্যাক্সেস কোড</Label>
                <div className="relative">
                  <Input
                    type={showCode ? 'text' : 'password'}
                    placeholder="আপনার ৬-অক্ষরের কোড"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    disabled={isLoading}
                    maxLength={6}
                    className="uppercase tracking-widest"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !selectedCandidateId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    যাচাই হচ্ছে...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    লগইন করুন
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
