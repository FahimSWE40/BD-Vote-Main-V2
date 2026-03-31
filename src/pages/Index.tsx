import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Monitor, BarChart3, Users, Vote, MapPin, CheckCircle, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StepCard } from "@/components/landing/StepCard";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const stats = [
  { icon: Users, label: "নিবন্ধিত ভোটার", value: "১.৫ কোটি+" },
  { icon: Vote, label: "নিরাপদ ভোট", value: "৮৫ লক্ষ+" },
  { icon: MapPin, label: "সক্রিয় কেন্দ্র", value: "৬৪ জেলা" },
];

const features = [
  {
    icon: Shield,
    title: "নিরাপদ (Blockchain)",
    description: "ব্লকচেইন প্রযুক্তির মাধ্যমে প্রতিটি ভোট এনক্রিপ্ট করা হয়, যা পরিবর্তন বা হ্যাক করা সম্পূর্ণ অসম্ভব।",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Monitor,
    title: "সহজ (Accessible)",
    description: "কোনো অ্যাপ ডাউনলোড ছাড়াই আপনার স্মার্টফোন বা কম্পিউটার থেকে সরাসরি ব্রাউজারের মাধ্যমে ভোট দিন।",
    color: "bg-success/10 text-success"
  },
  {
    icon: BarChart3,
    title: "স্বচ্ছ (Real-time)",
    description: "ভোট গণনার রিয়েল-টাইম লাইভ ফলাফল এবং অডিট লগ সবার জন্য উন্মুক্ত আছে।",
    color: "bg-warning/10 text-warning"
  },
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="relative bg-mesh py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp} className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
                <span className="size-2 bg-success rounded-full animate-pulse" />
                লাইভ ডেমো এখন সচল
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                আপনার পরিচয়,<br />
                আপনার ভোট,<br />
                <span className="text-primary">আপনার ভবিষ্যৎ</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                ব্লকচেইন এবং এআই প্রযুক্তিতে তৈরি বাংলাদেশের প্রথম নিরাপদ ও স্বচ্ছ ই-ভোটিং প্ল্যাটফর্ম। নাগরিক অধিকার এখন আপনার হাতের মুঠোয়।
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/verification">
                    ভোট দিতে ভেরিফিকেশন শুরু করুন
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")}>
                    কিভাবে কাজ করে?
                  </a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl shadow-2xl p-6 border border-border">
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                  লাইভ ডেমোইটিভ
                </div>
                <div className="bg-secondary rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Fingerprint className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">পরিচয় যাচাই</p>
                      <p className="text-xs text-muted-foreground">ফেস + আইডি স্ক্যান</p>
                    </div>
                  </div>
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Monitor className="size-8 mx-auto mb-2" />
                      <p className="text-sm">ক্যামেরা প্রিভিউ</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-success/10 text-success px-3 py-2 rounded-lg text-center text-sm font-medium">
                    <CheckCircle className="size-4 inline mr-1" />
                    যাচাইকৃত
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                      <stat.icon className="size-5" />
                      <span className="text-sm">{stat.label}</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              কেন <span className="text-primary">BD Vote</span> বেছে নেবেন?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              আমরা অত্যাধুনিক প্রযুক্তি ব্যবহার করে ভোটদানের অভিজ্ঞতাকে করেছি আরও উন্নত ও বিশ্বাসযোগ্য।
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`size-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      <feature.icon className="size-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Steps */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">মাত্র ৩টি সহজ ধাপে ভোট দিন</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">জটিলতা এড়িয়ে খুব সহজে এবং নিরাপদে আপনার ভোটাধিকার প্রয়োগ করুন।</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 relative">
          {/* Connecting Line - Visible only on md+ screens */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-border via-primary/30 to-border -z-10"></div>
          
          <StepCard 
            step="০১" 
            title="পরিচয় নিশ্চিত করুন" 
            desc="আপনার এনআইডি কার্ড এবং ফেস ভেরিফিকেশনের মাধ্যমে লগইন করুন।"
            icon="person_search"
            color="bg-primary"
          />
          <StepCard 
            step="০২" 
            title="প্রার্থী নির্বাচন করুন" 
            desc="ডিজিটাল ব্যালট পেপার থেকে আপনার পছন্দের প্রার্থীর মার্কা বেছে নিন।"
            icon="how_to_vote"
            color="bg-bd-green"
          />
          <StepCard 
            step="০৩" 
            title="ভোট নিশ্চিত করুন" 
            desc="এক ক্লিকে ভোট সাবমিট করুন যা সরাসরি ব্লকচেইনে সংরক্ষিত হবে।"
            icon="published_with_changes"
            color="bg-bd-red"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
              আপনার গণতান্ত্রিক অধিকার নিশ্চিত করুন
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              আজই আপনার ডিজিটাল পরিচয় যাচাই করুন এবং আগামী নির্বাচনে স্মার্টলি ভোটদানের জন্য প্রস্তুত হন। আপনার একটি ভোট দেশের ভবিষ্যৎ বদলে দিতে পারে।
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/verification">ভেরিফিকেশন শুরু করুন</Link>
            </Button>
            <div className="flex items-center justify-center gap-6 text-primary-foreground/60 text-sm pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4" />
                <span>নিরাপদ ও এনক্রিপ্টেড</span>
              </div>
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4" />
                <span>বায়োমেট্রিক সাপোর্ট</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
