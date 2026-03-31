import { Link } from "react-router-dom";
import { Shield, Sparkles } from "lucide-react";
import bdVoteLogo from "@/assets/bd-vote-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Logo and Description - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src={bdVoteLogo} alt="BD Vote" className="h-8 w-auto" />
              <span className="text-lg font-bold text-foreground">BD Vote</span>
            </div>
            <p className="text-sm text-muted-foreground">
             বাংলাদেশের জন্য আধুনিক, নিরাপদ এবং স্বচ্ছ ডিজিটাল ভোটিং সমাধান প্রদান।
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">লিঙ্কসমূহ</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/how-to-vote" className="hover:text-primary transition-colors">কিভাবে ভোট দেবেন</Link></li>
              <li><Link to="/security" className="hover:text-primary transition-colors">নিরাপত্তা নীতিমালা</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">সহায়তা</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/help" className="hover:text-primary transition-colors">হেল্প সেন্টার</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">প্রাইভেসি পলিসি</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">শর্তাবলী</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">যোগাযোগ</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>ইমেইল:</li>
              <li><a href="mailto:support@bdvote.com" className="text-primary hover:underline break-all">support@bdvote.com</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} BD Vote। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="size-3 sm:size-4" />
              <span>SHA-256 SECURED</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-3 sm:size-4" />
              <span>DISTRIBUTED LEDGER</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
