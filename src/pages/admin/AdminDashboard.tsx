import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStats } from '@/components/admin/AdminStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Users, ArrowRight, Activity, RefreshCw, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { useVoterStats, useRecentVoters } from '@/hooks/use-voters';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeletons';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
// Activity item component
function ActivityItem({ 
  icon: Icon, 
  title, 
  description, 
  time, 
  iconColor 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  time: string; 
  iconColor: string; 
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}

// Loading skeleton for activities
function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch, isRefetching } = useVoterStats();
  const { data: recentVoters, isLoading: isLoadingRecent } = useRecentVoters(5);
  const [initialLoading, setInitialLoading] = useState(true);

  // Show initial skeleton for first load
  useEffect(() => {
    if (!isLoading && !isLoadingRecent) {
      const timer = setTimeout(() => setInitialLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isLoadingRecent]);

  // Format time in Bengali
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: bn });
    } catch {
      return 'সম্প্রতি';
    }
  };

  if (initialLoading && (isLoading || isLoadingRecent)) {
    return (
      <AdminLayout title="অ্যাডমিন ড্যাশবোর্ড" subtitle="ভোটার ম্যানেজমেন্ট ও পরিসংখ্যান">
        <AdminDashboardSkeleton />
      </AdminLayout>
    );
  }
  return (
    <AdminLayout
      title="অ্যাডমিন ড্যাশবোর্ড"
      subtitle="ভোটার ম্যানেজমেন্ট ও পরিসংখ্যান"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-1.5"
        >
          <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">রিফ্রেশ</span>
        </Button>
      }
    >
      {/* Stats */}
      <AdminStats
        totalVoters={stats?.total || 0}
        verifiedVoters={stats?.verified || 0}
        pendingVoters={stats?.pending || 0}
        votedCount={stats?.voted || 0}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Upload className="size-4 sm:size-5 text-primary" />
              ভোটার আপলোড
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
              আইডি কার্ডের ছবি আপলোড করে নতুন ভোটার যোগ করুন।
            </p>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/admin/upload">
                আপলোড করুন <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="size-4 sm:size-5 text-primary" />
              ভোটার তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
              সকল রেজিস্টার্ড ভোটারের তালিকা দেখুন ও ভেরিফাই করুন।
            </p>
            <Button variant="outline" asChild size="sm" className="w-full sm:w-auto">
              <Link to="/admin/voters">
                তালিকা দেখুন <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="size-4 sm:size-5 text-primary" />
            সাম্প্রতিক কার্যক্রম
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-0">
              {[...Array(3)].map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : recentVoters && recentVoters.length > 0 ? (
            <div className="space-y-0">
              {recentVoters.map((voter) => (
                <ActivityItem
                  key={voter.id}
                  icon={voter.is_verified ? CheckCircle : UserPlus}
                  title={voter.is_verified ? 'ভোটার ভেরিফাই হয়েছে' : 'নতুন ভোটার যোগ হয়েছে'}
                  description={`${voter.full_name} (${voter.voter_id})`}
                  time={formatTime(voter.created_at)}
                  iconColor={voter.is_verified ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="size-10 mx-auto mb-3 opacity-50" />
              <p>কোনো সাম্প্রতিক কার্যক্রম নেই</p>
              <p className="text-sm mt-1">ভোটার যোগ করলে এখানে দেখা যাবে</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
