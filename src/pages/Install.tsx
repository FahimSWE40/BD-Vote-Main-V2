import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Share,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const features = [
  {
    icon: Smartphone,
    title: "মোবাইলে অ্যাপের মতো অভিজ্ঞতা",
    description: "হোম স্ক্রীনে আইকন যোগ করুন এবং ব্রাউজার ছাড়াই অ্যাপ ব্যবহার করুন।"
  },
  {
    icon: WifiOff,
    title: "অফলাইনে কাজ করে",
    description: "ইন্টারনেট চলে গেলেও অ্যাপ কাজ করবে এবং সংযোগ ফিরলে সিঙ্ক হবে।"
  },
  {
    icon: Bell,
    title: "পুশ নোটিফিকেশন",
    description: "ভোটের সময়, ফলাফল এবং গুরুত্বপূর্ণ আপডেট সম্পর্কে জানুন।"
  },
  {
    icon: Zap,
    title: "দ্রুত লোডিং",
    description: "ক্যাশড রিসোর্সের মাধ্যমে অবিশ্বাস্য দ্রুত লোডিং।"
  },
  {
    icon: Shield,
    title: "নিরাপদ এবং প্রাইভেট",
    description: "আপনার ডাটা ডিভাইসে সুরক্ষিত থাকে।"
  }
];

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="size-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Download className="size-12 text-white" />
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              BD Vote অ্যাপ ইনস্টল করুন
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              আপনার ফোনে BD Vote ইনস্টল করুন এবং যেকোনো সময় দ্রুত অ্যাক্সেস পান।
              অফলাইনেও কাজ করে!
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Card className={cn(
              "border-2 transition-all",
              isInstalled 
                ? "border-green-200 bg-green-50" 
                : "border-primary/20 bg-primary/5"
            )}>
              <CardContent className="p-8 text-center">
                {isInstalled ? (
                  <>
                    <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-800 mb-2">
                      অ্যাপ ইনস্টল করা হয়েছে!
                    </h2>
                    <p className="text-green-700">
                      BD Vote এখন আপনার হোম স্ক্রীনে আছে।
                    </p>
                  </>
                ) : isIOS ? (
                  <>
                    <Share className="size-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">iOS-এ ইনস্টল করুন</h2>
                    <div className="bg-white rounded-xl p-6 max-w-md mx-auto text-left space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          ১
                        </div>
                        <p>Safari-এর নিচে <Share className="size-4 inline" /> Share বাটনে ট্যাপ করুন</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          ২
                        </div>
                        <p>স্ক্রল করে <Plus className="size-4 inline" /> "Add to Home Screen" নির্বাচন করুন</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          ৩
                        </div>
                        <p>উপরে ডানে "Add" বাটনে ট্যাপ করুন</p>
                      </div>
                    </div>
                  </>
                ) : deferredPrompt ? (
                  <>
                    <Smartphone className="size-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">এখনই ইনস্টল করুন</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      এক ক্লিকে BD Vote আপনার ফোনে ইনস্টল করুন।
                    </p>
                    <Button size="lg" onClick={handleInstall} className="gap-2">
                      <Download className="size-5" />
                      অ্যাপ ইনস্টল করুন
                      <ArrowRight className="size-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Smartphone className="size-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">
                      ইনস্টল অপশন উপলব্ধ নয়
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      আপনার ব্রাউজার থেকে সরাসরি ইনস্টল করতে পারবেন। Chrome বা Edge এ
                      URL বারের পাশে ইনস্টল আইকন দেখুন।
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Connection Status */}
          <div className="flex justify-center mb-12">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              isOnline 
                ? "bg-green-100 text-green-700" 
                : "bg-amber-100 text-amber-700"
            )}>
              {isOnline ? (
                <>
                  <Wifi className="size-4" />
                  অনলাইন
                </>
              ) : (
                <>
                  <WifiOff className="size-4" />
                  অফলাইন - অ্যাপ এখনও কাজ করছে!
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="size-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
