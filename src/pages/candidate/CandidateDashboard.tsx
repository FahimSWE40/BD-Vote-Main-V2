import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Vote,
  TrendingUp,
  Clock,
  LogOut,
  BarChart3,
  CheckCircle,
  UserCircle,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCandidateAuth } from '@/hooks/use-candidate-auth';
import { useVoterStats } from '@/hooks/use-voters';
import { useCandidates } from '@/hooks/use-candidates';
import { useActiveElection } from '@/hooks/use-election-config';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const toBengaliNumerals = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { candidate, isAuthenticated, logout } = useCandidateAuth();
  const { data: voterStats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useVoterStats();
  const { data: candidates, isLoading: candidatesLoading, refetch: refetchCandidates } = useCandidates();
  const { data: activeElection } = useActiveElection();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', severity: 'medium' });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/candidate/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription for votes
  useEffect(() => {
    const channel = supabase
      .channel('candidate-votes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        refetchStats();
        refetchCandidates();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchStats, refetchCandidates]);

  const handleLogout = useCallback(() => {
    logout();
    toast({ title: 'লগআউট সফল', description: 'প্রার্থী ড্যাশবোর্ড থেকে বের হয়েছেন।' });
    navigate('/candidate/login');
  }, [logout, navigate, toast]);

  if (!candidate) return null;

  const turnoutPercent = voterStats?.total
    ? Math.round((voterStats.voted / voterStats.total) * 100)
    : 0;

  const activeCandidates = candidates?.filter(c => c.is_active) || [];
  const totalVotes = activeCandidates.reduce((s, c) => s + (c.vote_count || 0), 0);
  const myCandidateData = activeCandidates.find(c => c.id === candidate.id);
  const myVotes = myCandidateData?.vote_count || 0;
  const myPercent = totalVotes > 0 ? Math.round((myVotes / totalVotes) * 100) : 0;

  const timeStr = toBengaliNumerals(
    currentTime.toLocaleTimeString('en-GB', { hour12: false })
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-primary/20">
              <AvatarImage src={candidate.photo_url || ''} alt={candidate.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {candidate.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-foreground">{candidate.full_name}</h1>
              <p className="text-xs text-muted-foreground">
                {candidate.position} {candidate.party ? `• ${candidate.party}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-xs gap-1 hidden sm:flex">
              <Eye className="size-3" />
              শুধুমাত্র-পড়া
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">লগআউট</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Live Badge */}
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-destructive/10 text-destructive border-0 mb-2">
              <span className="size-1.5 bg-destructive rounded-full mr-1.5 animate-pulse" />
              সরাসরি আপডেট
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold">প্রার্থী ড্যাশবোর্ড</h2>
            <p className="text-sm text-muted-foreground">রিয়েল-টাইম নির্বাচনের তথ্য</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={isRefetching}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Users,
              label: 'মোট নিবন্ধিত ভোটার',
              value: statsLoading ? null : toBengaliNumerals(voterStats?.total || 0),
              sub: 'নিবন্ধিত',
            },
            {
              icon: Vote,
              label: 'ভোট প্রদান',
              value: statsLoading ? null : toBengaliNumerals(voterStats?.voted || 0),
              sub: `${toBengaliNumerals(turnoutPercent)}% উপস্থিতি`,
            },
            {
              icon: CheckCircle,
              label: 'যাচাইকৃত ভোটার',
              value: statsLoading ? null : toBengaliNumerals(voterStats?.verified || 0),
              sub: 'ভেরিফাইড',
            },
            {
              icon: Clock,
              label: 'সর্বশেষ আপডেট',
              value: timeStr,
              sub: 'লাইভ',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-xs mb-1">
                    <stat.icon className="size-3 sm:size-4 shrink-0" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  {stat.value !== null ? (
                    <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                  ) : (
                    <Skeleton className="h-7 w-20 mt-1" />
                  )}
                  <p className="text-[10px] sm:text-xs text-primary truncate">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Turnout Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="size-5 text-primary" />
                ভোটার উপস্থিতির হার
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {toBengaliNumerals(turnoutPercent)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {toBengaliNumerals(voterStats?.voted || 0)} / {toBengaliNumerals(voterStats?.total || 0)}
                    </span>
                  </div>
                  <Progress value={turnoutPercent} className="h-3" />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Candidate Standings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="size-5 text-primary" />
                    প্রার্থীদের অবস্থান
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">সরাসরি ভোট গণনা</p>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-0 text-xs">
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidatesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : activeCandidates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">কোনো সক্রিয় প্রার্থী নেই</p>
              ) : (
                activeCandidates
                  .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                  .map((c) => {
                    const votePercent = totalVotes > 0 ? Math.round(((c.vote_count || 0) / totalVotes) * 100) : 0;
                    const isMe = c.id === candidate.id;
                    return (
                      <div key={c.id} className={`p-3 rounded-lg ${isMe ? 'bg-primary/5 border border-primary/20' : ''}`}>
                        <div className="flex justify-between mb-1.5 gap-2">
                          <span className={`font-medium text-sm sm:text-base truncate ${isMe ? 'text-primary' : ''}`}>
                            {c.full_name}
                            {c.party ? ` (${c.party})` : ''}
                            {isMe && (
                              <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">আপনি</Badge>
                            )}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {toBengaliNumerals(c.vote_count || 0)} ({toBengaliNumerals(votePercent)}%)
                          </span>
                        </div>
                        <Progress value={votePercent} className="h-2" />
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* My Performance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle className="size-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1">আপনার পরিসংখ্যান</h3>
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                {toBengaliNumerals(myVotes)}
              </p>
              <p className="text-sm text-muted-foreground">
                মোট প্রাপ্ত ভোট ({toBengaliNumerals(myPercent)}%)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Incident Reporting - FR-17 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="size-5 text-destructive" />
                ঘটনা রিপোর্ট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                কোনো অনিয়ম বা সমস্যা দেখলে এখানে রিপোর্ট করুন।
              </p>
              <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <AlertTriangle className="size-4" /> অভিযোগ জমা দিন
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ঘটনা রিপোর্ট করুন</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>শিরোনাম</Label>
                      <Input
                        placeholder="সমস্যার শিরোনাম"
                        value={incidentForm.title}
                        onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>বিবরণ</Label>
                      <Textarea
                        placeholder="বিস্তারিত বর্ণনা করুন..."
                        value={incidentForm.description}
                        onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>তীব্রতা</Label>
                      <Select value={incidentForm.severity} onValueChange={v => setIncidentForm(f => ({ ...f, severity: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">নিম্ন</SelectItem>
                          <SelectItem value="medium">মাঝারি</SelectItem>
                          <SelectItem value="high">উচ্চ</SelectItem>
                          <SelectItem value="critical">জরুরি</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={async () => {
                        if (!incidentForm.title || !incidentForm.description) {
                          toast({ title: 'সকল ফিল্ড পূরণ করুন', variant: 'destructive' });
                          return;
                        }
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            toast({ title: 'লগইন প্রয়োজন', variant: 'destructive' });
                            return;
                          }
                          const { error } = await supabase
                            .from('incidents')
                            .insert({
                              title: incidentForm.title,
                              description: incidentForm.description,
                              severity: incidentForm.severity,
                              reported_by: user.id,
                            });
                          if (error) throw error;
                          toast({ title: 'রিপোর্ট জমা হয়েছে' });
                          setIncidentForm({ title: '', description: '', severity: 'medium' });
                          setIncidentDialogOpen(false);
                        } catch {
                          toast({ title: 'রিপোর্ট জমা দিতে সমস্যা', variant: 'destructive' });
                        }
                      }}
                    >
                      জমা দিন
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
