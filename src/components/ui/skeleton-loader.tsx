import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-gray-200 shadow-sm", className)}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-6 w-36" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-28 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function CandidateCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-6 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function ResultsChartSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>

      {/* Status Banner */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BallotSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <CandidateCardSkeleton key={i} />
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Skeleton className="h-14 w-48 rounded-xl" />
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-6 w-24 mb-3 rounded-full" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <ResultsChartSkeleton />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <Skeleton className="h-6 w-48" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
