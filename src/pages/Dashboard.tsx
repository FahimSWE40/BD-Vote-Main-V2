import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  Wallet, 
  Vote, 
  Clock, 
  History, 
  LogIn, 
  CheckCircle, 
  RefreshCw, 
  Mail, 
  ArrowRight, 
  BarChart3,
  Copy,
  UserCheck,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { supabase } from "@/integrations/supabase/client";
import { useActiveElection } from "@/hooks/use-election-config";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Convert to Bengali numerals
const toBengaliNumerals = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().padStart(2, '0').replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)]);
};

type ColorVariant = 'green' | 'blue' | 'orange' | 'red';

const colorStyles: Record<ColorVariant, { bg: string; text: string; border: string; icon: string }> = {
  green: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: 'bg-success/10 text-success' },
  blue: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: 'bg-primary/10 text-primary' },
  orange: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: 'bg-warning/10 text-warning' },
  red: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: 'bg-destructive/10 text-destructive' },
};

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  tag: string;
  color: ColorVariant;
  copyable?: boolean;
}

function InfoCard({ icon: Icon, title, value, tag, color, copyable }: InfoCardProps) {
  const c = colorStyles[color];

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("কপি করা হয়েছে!");
  };

  return (
    <div className="bg-card p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-2 sm:gap-3 relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <div className={cn("size-8 sm:size-10 rounded-lg flex items-center justify-center", c.icon)}>
          <Icon className="size-4 sm:size-5" />
        </div>
        <span className={cn("px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-wider border", c.bg, c.text, c.border)}>
          {tag}
        </span>
      </div>
      
      <div className="z-10">
        <h4 className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1">{title}</h4>
        <div className="flex items-center gap-2">
          <p className="text-foreground font-mono font-bold text-sm sm:text-base md:text-lg truncate">{value}</p>
          {copyable && (
            <button 
              onClick={handleCopy}
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="Copy"
            >
              <Copy className="size-3 sm:size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LogItemProps {
  icon: React.ElementType;
  text: string;
  time: string;
  colorClass: string;
}

function LogItem({ icon: Icon, text, time, colorClass }: LogItemProps) {
  return (
    <div className="py-2 sm:py-3 flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="p-1 sm:p-1.5 rounded-md bg-muted group-hover:bg-card transition-colors shrink-0">
          <Icon className={cn("size-4 sm:size-5", colorClass)} />
        </div>
        <span className="text-xs sm:text-sm font-medium text-foreground truncate">{text}</span>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium shrink-0 ml-2">{time}</span>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'এইমাত্র';
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  return 'গতকাল';
}

function DashboardContent() {
  const queryClient = useQueryClient();
  const { data: election } = useActiveElection();

  // Get verified voter info from session
  const verifiedVoterId = sessionStorage.getItem('verified_voter_id');
  const verifiedVoterName = sessionStorage.getItem('verified_voter_name');

  // Fetch voter data from DB if verified
  const { data: voterData, isLoading: voterLoading } = useQuery({
    queryKey: ['dashboard-voter', verifiedVoterId],
    queryFn: async () => {
      if (!verifiedVoterId) return null;
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('id', verifiedVoterId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!verifiedVoterId,
  });

  // Fetch recent audit logs
  const { data: recentLogs } = useQuery({
    queryKey: ['dashboard-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('action, entity_type, created_at, details')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 30000,
  });

  // Calculate time remaining from election config
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    if (!election?.end_time) return;
    const deadline = new Date(election.end_time).getTime();
    
    const timer = setInterval(() => {
      setTimeRemaining(Math.max(0, deadline - Date.now()));
    }, 1000);

    setTimeRemaining(Math.max(0, deadline - Date.now()));
    return () => clearInterval(timer);
  }, [election?.end_time]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    toast.success("ডাটা রিফ্রেশ হয়েছে!");
  }, [queryClient]);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  const countdownDisplay = election?.end_time 
    ? `${toBengaliNumerals(hours)} ঘণ্টা ${toBengaliNumerals(minutes)} মিনিট ${toBengaliNumerals(seconds)} সেকেন্ড`
    : 'নির্ধারিত নয়';
  const isExpired = election?.end_time ? timeRemaining === 0 : false;

  const voterName = voterData?.full_name || verifiedVoterName || 'ভোটার';
  const voterId = voterData?.voter_id || '—';
  const hasVoted = voterData?.has_voted || false;
  const isVerified = voterData?.is_verified || false;

  const getLogIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return { icon: LogIn, color: 'text-success' };
    if (action.includes('vote')) return { icon: CheckCircle, color: 'text-primary' };
    if (action.includes('verify')) return { icon: CheckCircle, color: 'text-primary' };
    return { icon: RefreshCw, color: 'text-muted-foreground' };
  };

  return (
    <div className="flex-1 bg-background min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4 shadow-sm">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary font-medium">হোম</span>
          <span>/</span>
          <span>ড্যাশবোর্ড</span>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
          shouldRefresh={shouldRefresh}
        />
        
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
          
            {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              <p className="text-muted-foreground font-medium text-sm sm:text-base">শুভ অপরাহ্ন,</p>
              <h2 className="text-foreground text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">{voterName}</h2>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 sm:px-4 py-2 rounded-full border border-border shadow-sm self-start md:self-auto">
              <div className={cn("size-2 rounded-full animate-pulse", isVerified ? "bg-success" : "bg-warning")}></div>
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {isVerified ? 'যাচাই সম্পন্ন' : 'যাচাই বাকি'}
              </span>
            </div>
          </div>

          {/* Status Banner */}
          <div className={cn(
            "relative overflow-hidden rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 transition-all",
            hasVoted 
              ? "bg-gradient-to-br from-success/10 to-card border-success/20" 
              : "bg-gradient-to-br from-primary/10 to-card border-primary/20"
          )}>
            
            <div className="flex gap-4 sm:gap-6 items-center z-10">
              <div className={cn(
                "size-12 sm:size-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                hasVoted 
                  ? "bg-success text-success-foreground" 
                  : "bg-card text-primary border border-primary/20"
              )}>
                {hasVoted ? <UserCheck className="size-6 sm:size-8" /> : <Vote className="size-6 sm:size-8" />}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className={cn("text-lg sm:text-xl md:text-2xl font-black", hasVoted ? "text-success" : "text-foreground")}>
                  {hasVoted ? "ভোট প্রদান সম্পন্ন হয়েছে" : "আপনার ভোট এখনো বাকি"}
                </h3>
                <p className="text-muted-foreground max-w-lg text-sm sm:text-base md:text-lg">
                  {hasVoted 
                    ? "ধন্যবাদ! আপনার ভোটটি ব্লকচেইনে সফলভাবে রেকর্ড করা হয়েছে।"
                    : "গণতন্ত্রের চর্চায় অংশ নিন। এখনই আপনার ভোটাধিকার প্রয়োগ করুন।"
                  }
                </p>
              </div>
            </div>
            
            <div className="z-10 w-full md:w-auto">
              {!hasVoted ? (
                <Link to={isVerified ? "/ballot" : "/verification"}>
                  <button className="w-full md:w-auto min-w-[180px] sm:min-w-[200px] flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg hover:bg-primary/90 hover:shadow-lg hover:-translate-y-1 transition-all">
                    {isVerified ? 'ভোট দিন' : 'যাচাই করুন'}
                    <ArrowRight className="size-4 sm:size-5" />
                  </button>
                </Link>
              ) : (
                <Link to="/results">
                  <button className="w-full md:w-auto min-w-[180px] sm:min-w-[200px] flex items-center justify-center gap-2 bg-card text-success border border-success/20 py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg hover:bg-success/5 transition-all shadow-sm">
                    ফলাফল দেখুন
                    <BarChart3 className="size-4 sm:size-5" />
                  </button>
                </Link>
              )}
            </div>

            {/* Background Decoration */}
            <div className={cn(
              "absolute -right-10 -bottom-10 size-32 sm:size-64 rounded-full opacity-10 pointer-events-none",
              hasVoted ? "bg-success" : "bg-primary"
            )}></div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Left Column: Personal Info */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InfoCard 
                icon={CreditCard} 
                title="ভোটার আইডি" 
                value={voterId} 
                tag={isVerified ? "ভেরিফাইড" : "অযাচাই"} 
                color={isVerified ? "green" : "orange"} 
              />
              <InfoCard 
                icon={Wallet} 
                title="নির্বাচন" 
                value={election?.election_name || 'কনফিগার করা হয়নি'} 
                tag={election?.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"} 
                color={election?.is_active ? "blue" : "orange"} 
              />
              <InfoCard 
                icon={Vote} 
                title="ভোটের অবস্থা" 
                value={hasVoted ? "ভোট দেওয়া হয়েছে ✅" : "ভোট বাকি"} 
                tag={hasVoted ? "সম্পন্ন" : "পেন্ডিং"} 
                color={hasVoted ? "green" : "orange"} 
              />
              <InfoCard 
                icon={Clock} 
                title="ভোটের সময় বাকি" 
                value={isExpired ? "সময় শেষ" : countdownDisplay} 
                tag={isExpired ? "শেষ" : "চলমান"} 
                color="red" 
              />
            </div>

            {/* Right Column: Recent Activity */}
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm p-4 sm:p-6 flex flex-col h-full">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <History className="size-4 sm:size-5 text-muted-foreground" />
                অ্যাক্টিভিটি লগ
              </h3>
              <div className="flex flex-col gap-0 divide-y divide-border">
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log, i) => {
                    const { icon, color } = getLogIcon(log.action);
                    return (
                      <LogItem 
                        key={i} 
                        icon={icon} 
                        text={log.action.replace(/_/g, ' ')} 
                        time={formatTimeAgo(log.created_at)} 
                        colorClass={color} 
                      />
                    );
                  })
                ) : (
                  <>
                    <LogItem icon={LogIn} text="সিস্টেমে প্রবেশ" time="এইমাত্র" colorClass="text-success" />
                    <LogItem icon={RefreshCw} text="ড্যাশবোর্ড লোড হয়েছে" time="এইমাত্র" colorClass="text-muted-foreground" />
                  </>
                )}
              </div>
              <Link to="/results" className="mt-auto pt-4 text-primary text-xs sm:text-sm font-bold hover:underline text-center w-full block">
                সব দেখুন
              </Link>
            </div>

          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <DashboardContent />
      </div>
    </SidebarProvider>
  );
}
