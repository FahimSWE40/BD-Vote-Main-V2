import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminStatsProps {
  totalVoters: number;
  verifiedVoters: number;
  pendingVoters: number;
  votedCount: number;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

function StatCard({ title, value, icon: Icon, colorClass, bgClass }: StatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`size-8 sm:size-10 md:size-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
            <Icon className={`size-4 sm:size-5 md:size-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminStats({
  totalVoters,
  verifiedVoters,
  pendingVoters,
  votedCount,
  isLoading,
}: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-24 mb-2 sm:mb-3" />
                <div className="h-6 sm:h-8 bg-muted rounded w-10 sm:w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <StatCard
        title="মোট ভোটার"
        value={totalVoters}
        icon={Users}
        colorClass="text-blue-600"
        bgClass="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        title="ভেরিফাইড"
        value={verifiedVoters}
        icon={UserCheck}
        colorClass="text-green-600"
        bgClass="bg-green-100 dark:bg-green-900/30"
      />
      <StatCard
        title="পেন্ডিং"
        value={pendingVoters}
        icon={Clock}
        colorClass="text-yellow-600"
        bgClass="bg-yellow-100 dark:bg-yellow-900/30"
      />
      <StatCard
        title="ভোট দিয়েছে"
        value={votedCount}
        icon={UserX}
        colorClass="text-purple-600"
        bgClass="bg-purple-100 dark:bg-purple-900/30"
      />
    </div>
  );
}
