import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text = "লোড হচ্ছে..." }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16"
  };

  const containerClasses = {
    sm: "py-8",
    md: "py-16",
    lg: "py-24"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-muted-foreground text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text="পেজ লোড হচ্ছে..." />
    </div>
  );
}
