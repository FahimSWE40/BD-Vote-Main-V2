import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  shouldRefresh: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  shouldRefresh,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: pullDistance }}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-1 text-primary transition-all",
          isRefreshing && "animate-pulse"
        )}
      >
        <div
          className={cn(
            "size-8 rounded-full bg-primary/10 flex items-center justify-center transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw className="size-4" />
        </div>
        <span className="text-xs font-medium">
          {isRefreshing
            ? "রিফ্রেশ হচ্ছে..."
            : shouldRefresh
            ? "ছেড়ে দিন"
            : "টানুন রিফ্রেশ করতে"}
        </span>
      </div>
    </div>
  );
}
