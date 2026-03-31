import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="size-8 sm:size-10 rounded-lg" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 sm:h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 sm:size-5" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 sm:size-5" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminVotersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <Card className="border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardHeader className="py-3 sm:py-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <div className="space-y-3 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminCandidatesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search */}
      <Skeleton className="h-10 w-full" />

      {/* Stats */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Candidates List */}
      <div className="space-y-5 sm:space-y-6">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="grid gap-3">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <Skeleton className="size-12 sm:size-16 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2 mt-2">
                          <Skeleton className="h-7 w-20" />
                          <Skeleton className="h-7 w-16" />
                          <Skeleton className="h-7 w-8" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, cardIndex) => (
        <Card key={cardIndex} className="border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 sm:size-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            {cardIndex === 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-36" />
              </>
            ) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminUploadSkeleton() {
  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="border-border border-dashed">
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center">
            <Skeleton className="size-12 sm:size-16 rounded-full mb-4" />
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-4" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
