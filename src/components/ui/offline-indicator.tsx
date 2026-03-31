import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

export function OfflineIndicator() {
  const { isOnline, queueLength, isProcessing } = useOfflineQueue();

  if (isOnline && queueLength === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5",
        isOnline 
          ? "bg-primary text-white" 
          : "bg-amber-500 text-white"
      )}
    >
      {isOnline ? (
        <>
          {isProcessing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Wifi className="size-5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm">
              {isProcessing ? "ট্রানজ্যাকশন প্রসেস হচ্ছে..." : "সংযোগ পুনরায় স্থাপিত"}
            </p>
            {queueLength > 0 && (
              <p className="text-xs opacity-90">
                {queueLength}টি পেন্ডিং ট্রানজ্যাকশন
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <WifiOff className="size-5" />
          <div className="flex-1">
            <p className="font-bold text-sm">অফলাইন মোড</p>
            <p className="text-xs opacity-90">
              {queueLength > 0 
                ? `${queueLength}টি ট্রানজ্যাকশন কিউতে আছে` 
                : "সংযোগ ফিরলে সিঙ্ক হবে"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
