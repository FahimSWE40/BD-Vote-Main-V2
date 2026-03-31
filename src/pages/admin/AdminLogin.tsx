import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import bdVoteLogo from '@/assets/bd-vote-logo.png';
import { AdminIdCardVerification } from '@/components/admin/AdminIdCardVerification';
import { AdminFaceVerification } from '@/components/admin/AdminFaceVerification';
import { ExtractedData } from '@/lib/ocr';
import { preloadFaceModels } from '@/lib/face-verification';

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

const signupSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  confirmPassword: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'পাসওয়ার্ড মিলছে না',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type AuthStep = 'credentials' | 'id-card' | 'face-scan';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [adminEmail, setAdminEmail] = useState('');
  const [idCardData, setIdCardData] = useState<ExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    preloadFaceModels();
  }, []);

  // Check if already logged in as admin
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (role) {
          navigate('/admin', { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthStep('credentials');
    setIdCardData(null);
    setAdminEmail('');
  };

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('লগইন ব্যর্থ হয়েছে');

      // Check admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        await supabase.auth.signOut();
        throw new Error('রোল চেক করতে সমস্যা হয়েছে');
      }

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: 'অ্যাক্সেস অস্বীকার',
          description: 'আপনার অ্যাডমিন অ্যাক্সেস নেই। শুধুমাত্র অ্যাডমিনরা এই প্যানেলে প্রবেশ করতে পারবেন।',
          variant: 'destructive',
        });
        return;
      }

      // Proceed to 2FA
      setAdminEmail(data.email);
      setAuthStep('id-card');
      toast({
        title: 'ক্রেডেনশিয়াল যাচাই সফল',
        description: 'এখন আইডি কার্ড যাচাই করুন।',
      });
    } catch (error: any) {
      toast({
        title: 'লগইন ব্যর্থ',
        description: error.message || 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Sign up
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signupError) throw new Error(signupError.message);
      if (!authData.user) throw new Error('অ্যাকাউন্ট তৈরি ব্যর্থ');

      // Assign admin role via edge function
      const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-admin');

      if (setupError) {
        console.error('Setup admin error:', setupError);
        toast({
          title: 'সতর্কতা',
          description: 'অ্যাকাউন্ট তৈরি হয়েছে কিন্তু অ্যাডমিন রোল অ্যাসাইন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
          variant: 'destructive',
        });
        return;
      }

      if (setupData?.error) {
        await supabase.auth.signOut();
        toast({
          title: 'অ্যাক্সেস অস্বীকার',
          description: setupData.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'অ্যাডমিন অ্যাকাউন্ট তৈরি সফল!',
        description: 'এখন লগইন করুন।',
      });

      // Auto-switch to login tab
      setActiveTab('login');
      loginForm.setValue('email', data.email);
      signupForm.reset();
    } catch (error: any) {
      toast({
        title: 'রেজিস্ট্রেশন ব্যর্থ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdCardVerified = (data: ExtractedData) => {
    setIdCardData(data);
    setAuthStep('face-scan');
  };

  const handleFaceVerified = () => {
    toast({
      title: 'সফলভাবে লগইন হয়েছে',
      description: 'অ্যাডমিন প্যানেলে স্বাগতম!',
    });
    navigate('/admin');
  };

  const handleVerificationFailed = async () => {
    await handleLogout();
    toast({
      title: 'যাচাই ব্যর্থ',
      description: 'নিরাপত্তার জন্য আপনাকে আবার লগইন করতে হবে।',
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <img src={bdVoteLogo} alt="BD Vote" className="h-16 w-auto mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">অ্যাডমিন প্যানেল</CardTitle>
            <CardDescription className="mt-2">
              অ্যাডমিন প্যানেলে প্রবেশ করতে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন
            </CardDescription>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-success/10 rounded-lg py-2 px-3">
            <ShieldCheck className="size-4 text-success" />
            <span>২-ফ্যাক্টর যাচাই সক্রিয় (আইডি কার্ড + ফেস স্ক্যান)</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="flex items-center gap-1.5">
                <LogIn className="size-3.5" />
                লগইন
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-1.5">
                <UserPlus className="size-3.5" />
                রেজিস্ট্রেশন
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ইমেইল</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" autoComplete="email" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>পাসওয়ার্ড</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />যাচাই হচ্ছে...</> : 'লগইন করুন'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ইমেইল</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" autoComplete="email" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>পাসওয়ার্ড</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" autoComplete="new-password" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>পাসওয়ার্ড নিশ্চিত করুন</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" autoComplete="new-password" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />তৈরি হচ্ছে...</> : 'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    প্রথম রেজিস্ট্রেশনকারী স্বয়ংক্রিয়ভাবে অ্যাডমিন হবেন। পরবর্তী অ্যাডমিনদের বিদ্যমান অ্যাডমিন দ্বারা অনুমোদিত হতে হবে।
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Step 1: ID Card Verification Modal */}
      <AdminIdCardVerification
        open={authStep === 'id-card'}
        onOpenChange={(open) => { if (!open) handleVerificationFailed(); }}
        onVerificationComplete={handleIdCardVerified}
        adminEmail={adminEmail}
      />

      {/* Step 2: Face Scan Verification Modal */}
      <AdminFaceVerification
        open={authStep === 'face-scan'}
        onOpenChange={(open) => { if (!open) handleVerificationFailed(); }}
        onVerificationComplete={handleFaceVerified}
        onVerificationFailed={handleVerificationFailed}
        idCardData={idCardData}
      />
    </div>
  );
}
