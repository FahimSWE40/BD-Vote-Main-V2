import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Shield, 
  Sparkles,
  ExternalLink,
  CheckCircle,
  Clock,
  Users,
  Vote,
  BarChart3,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatTxHash, getExplorerUrl } from "@/lib/blockchain";

const toBengaliNumerals = (num: string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)]);
};

const formatBengaliNumber = (num: number): string => {
  return toBengaliNumerals(num.toLocaleString('en-IN'));
};

const PARTY_COLORS: Record<string, string> = {
  'নীল দল': 'bg-primary',
  'সবুজ দল': 'bg-success',
  'কমলা দল': 'bg-warning',
  'স্বতন্ত্র': 'bg-muted-foreground',
};

const getPartyColor = (party: string | null, index: number): string => {
  if (party && PARTY_COLORS[party]) return PARTY_COLORS[party];
  const fallback = ['bg-primary', 'bg-success', 'bg-warning', 'bg-muted-foreground'];
  return fallback[index % fallback.length];
};

async function fetchCandidateResults() {
  const { data, error } = await supabase
    .from('candidates')
    .select('id, full_name, party, vote_count, photo_url')
    .eq('is_active', true)
    .order('vote_count', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchRecentVotes(limit = 10) {
  const { data, error } = await supabase
    .from('votes')
    .select('id, tx_hash, voter_id_hash, status, created_at, candidate_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function fetchVoterStats() {
  const { count: totalVoters } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true });

  const { count: votedCount } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true })
    .eq('has_voted', true);

  return {
    totalVoters: totalVoters || 0,
    votedCount: votedCount || 0,
    turnout: totalVoters ? ((votedCount || 0) / totalVoters * 100).toFixed(1) : '0',
  };
}

export default function Results() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return toBengaliNumerals(now.toLocaleTimeString('en-GB', { hour12: false }));
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['results-candidates'],
    queryFn: fetchCandidateResults,
    refetchInterval: 30000,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['results-transactions'],
    queryFn: () => fetchRecentVotes(10),
    refetchInterval: 15000,
  });

  const { data: voterStats, isLoading: statsLoading } = useQuery({
    queryKey: ['results-voter-stats'],
    queryFn: fetchVoterStats,
    refetchInterval: 30000,
  });

  const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('results-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        queryClient.invalidateQueries({ queryKey: ['results-candidates'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['results-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['results-voter-stats'] });
        queryClient.invalidateQueries({ queryKey: ['results-candidates'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['results-candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['results-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['results-voter-stats'] }),
    ]);
    const now = new Date();
    setCurrentTime(toBengaliNumerals(now.toLocaleTimeString('en-GB', { hour12: false })));
  }, [queryClient]);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(toBengaliNumerals(now.toLocaleTimeString('en-GB', { hour12: false })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const turnoutPercent = voterStats?.turnout || '০';

  const stats = [
    { label: "মোট সংগৃহীত ভোট", value: formatBengaliNumber(totalVotes), change: totalVotes > 0 ? "সরাসরি" : undefined, icon: Vote },
    { label: "ভোটার উপস্থিতির হার", value: toBengaliNumerals(`${turnoutPercent}%`), subtext: `${formatBengaliNumber(voterStats?.votedCount || 0)} জন ভোট দিয়েছেন`, icon: Users },
    { label: "নিবন্ধিত ভোটার", value: formatBengaliNumber(voterStats?.totalVoters || 0), subtext: "যাচাইকৃত ডাটা", icon: BarChart3 },
    { label: "সর্বশেষ আপডেট", value: currentTime, subtext: "সরাসরি সচল", icon: Clock },
  ];

  const isLoading = candidatesLoading || txLoading || statsLoading;

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-background overflow-auto">
      <Navbar variant="app" />

      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
        shouldRefresh={shouldRefresh}
      />

      <main className="flex-1 py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6 sm:mb-8">
            <div>
              <Badge className="bg-destructive/10 text-destructive border-0 mb-2 sm:mb-3">
                <span className="size-1.5 sm:size-2 bg-destructive rounded-full mr-1.5 sm:mr-2 animate-pulse" />
                সরাসরি আপডেট
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">লাইভ নির্বাচনের ফলাফল</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                রিয়েল-টাইম ব্লকচেইন ও ডাটাবেস থেকে সরাসরি তথ্য
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Download className="size-3.5 sm:size-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">রিপোর্ট</span> ডাউনলোড
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn("size-3.5 sm:size-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
                রিফ্রেশ
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-xs mb-1">
                      <stat.icon className="size-3 sm:size-4 shrink-0" />
                      <span className="truncate leading-tight">{stat.label}</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-bold truncate">{stat.value}</p>
                    {stat.change ? (
                      <p className="text-[10px] sm:text-xs text-success flex items-center gap-0.5 sm:gap-1">
                        <TrendingUp className="size-2.5 sm:size-3 shrink-0" />
                        {stat.change}
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-primary truncate">{stat.subtext}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8 mb-6 sm:mb-8">
            {/* Vote Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                        <BarChart3 className="size-4 sm:size-5" />
                        ভোটের পরিসংখ্যান
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">প্রার্থী ভিত্তিক ফলাফল</p>
                    </div>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-0 text-[10px] sm:text-xs shrink-0">
                      LIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4 space-y-4 sm:space-y-5">
                  {candidatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : candidates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">কোনো প্রার্থী পাওয়া যায়নি</p>
                  ) : (
                    candidates.map((candidate, index) => {
                      const percent = totalVotes > 0 ? Math.round((candidate.vote_count / totalVotes) * 100) : 0;
                      return (
                        <div key={candidate.id}>
                          <div className="flex justify-between mb-1.5 sm:mb-2 gap-2">
                            <span className="font-medium text-sm sm:text-base truncate">
                              {candidate.full_name}
                              {candidate.party && (
                                <span className="text-muted-foreground text-xs ml-1">({candidate.party})</span>
                              )}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              {formatBengaliNumber(candidate.vote_count)} ({toBengaliNumerals(`${percent}`)}%)
                            </span>
                          </div>
                          <Progress value={percent} className={`h-2 sm:h-3 ${getPartyColor(candidate.party, index)}`} />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">ভোট গ্রহণের সারাংশ</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">রিয়েল-টাইম ডাটাবেস থেকে</p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  {candidatesLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {candidates.slice(0, 3).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={cn(
                            "size-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
                            i === 0 ? "bg-primary" : i === 1 ? "bg-success" : "bg-warning"
                          )}>
                            {toBengaliNumerals(`${i + 1}`)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.party || 'স্বতন্ত্র'}</p>
                          </div>
                          <p className="font-bold text-sm">{formatBengaliNumber(c.vote_count)}</p>
                        </div>
                      ))}
                      {totalVotes === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">এখনো কোনো ভোট জমা হয়নি</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Blockchain Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                  <Sparkles className="size-4 sm:size-5" />
                  ব্লকচেইন ট্রানজ্যাকশন
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {txLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">কোনো ট্রানজ্যাকশন নেই</p>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block sm:hidden divide-y divide-border">
                      {transactions.map((tx) => {
                        const txHashDisplay = tx.tx_hash ? formatTxHash(tx.tx_hash) : 'N/A';
                        const isVerified = tx.status === 'confirmed';
                        const isSimulated = tx.status === 'simulated';
                        const time = new Date(tx.created_at);
                        const timeStr = toBengaliNumerals(time.toLocaleTimeString('en-GB', { hour12: false }));

                        return (
                          <div key={tx.id} className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              {tx.tx_hash && tx.tx_hash.startsWith('0x') ? (
                                <a
                                  href={getExplorerUrl(tx.tx_hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-mono text-xs flex items-center gap-1"
                                >
                                  {txHashDisplay}
                                  <ExternalLink className="size-3" />
                                </a>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">{txHashDisplay}</span>
                              )}
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px]",
                                  isVerified
                                    ? "bg-success/10 text-success border-0" 
                                    : isSimulated
                                    ? "bg-warning/10 text-warning border-0"
                                    : "bg-muted text-muted-foreground border-0"
                                )}
                              >
                                {isVerified ? (
                                  <><CheckCircle className="size-2.5 mr-1" />ব্লকচেইনে যাচাইকৃত</>
                                ) : isSimulated ? (
                                  <><Clock className="size-2.5 mr-1" />সিমুলেটেড</>
                                ) : (
                                  <><Clock className="size-2.5 mr-1" />অপেক্ষমান</>
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{timeStr}</span>
                              <span>{isVerified ? 'Sepolia Testnet' : 'সিমুলেটেড হ্যাশ'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr className="text-left text-xs sm:text-sm text-muted-foreground">
                            <th className="px-4 sm:px-6 py-3 font-medium">TX হ্যাশ</th>
                            <th className="px-4 sm:px-6 py-3 font-medium">সময়</th>
                            <th className="px-4 sm:px-6 py-3 font-medium">স্ট্যাটাস</th>
                            <th className="px-4 sm:px-6 py-3 font-medium">নেটওয়ার্ক</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transactions.map((tx) => {
                            const txHashDisplay = tx.tx_hash ? formatTxHash(tx.tx_hash) : 'N/A';
                            const isVerified = tx.status === 'confirmed';
                            const isSimulated = tx.status === 'simulated';
                            const time = new Date(tx.created_at);
                            const timeStr = toBengaliNumerals(time.toLocaleTimeString('en-GB', { hour12: false }));

                            return (
                              <tr key={tx.id} className="hover:bg-muted/50">
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                  {tx.tx_hash && tx.tx_hash.startsWith('0x') ? (
                                    <a
                                      href={getExplorerUrl(tx.tx_hash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-mono text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                                    >
                                      {txHashDisplay}
                                      <ExternalLink className="size-3" />
                                    </a>
                                  ) : (
                                    <span className="font-mono text-xs sm:text-sm text-muted-foreground">{txHashDisplay}</span>
                                  )}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{timeStr}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      isVerified
                                        ? "bg-success/10 text-success border-0" 
                                        : isSimulated
                                        ? "bg-warning/10 text-warning border-0"
                                        : "bg-muted text-muted-foreground border-0"
                                    )}
                                  >
                                    {isVerified ? (
                                      <><CheckCircle className="size-3 mr-1" />ব্লকচেইনে যাচাইকৃত</>
                                    ) : isSimulated ? (
                                      <><Clock className="size-3 mr-1" />সিমুলেটেড</>
                                    ) : (
                                      <><Clock className="size-3 mr-1" />অপেক্ষমান</>
                                    )}
                                  </Badge>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                                  {isVerified ? 'Sepolia Testnet' : 'সিমুলেটেড হ্যাশ'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <div className="p-3 sm:p-4 text-center">
                  <Button variant="link" className="text-primary text-xs sm:text-sm">
                    আরো ট্রানজ্যাকশন দেখুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 sm:mt-8 lg:mt-12"
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="size-12 sm:size-14 lg:size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="size-6 sm:size-7 lg:size-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-1.5 sm:mb-2">ব্লকচেইন নিরাপত্তা নিশ্চিত</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  এই তথ্যগুলো সরাসরি ডাটাবেস ও ব্লকচেইন নেটওয়ার্ক থেকে আসছে। রিয়েল-টাইম সাবস্ক্রিপশনের মাধ্যমে ডাটা স্বয়ংক্রিয়ভাবে আপডেট হয়।
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
