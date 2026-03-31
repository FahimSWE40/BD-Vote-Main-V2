import { motion } from "framer-motion";
import bdVoteLogo from "@/assets/bd-vote-logo.png";
import { Users, Target, Shield, Award, Globe, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const values = [
  {
    icon: Shield,
    title: "নিরাপত্তা",
    description: "ব্লকচেইন প্রযুক্তি ব্যবহার করে প্রতিটি ভোট সুরক্ষিত এবং অপরিবর্তনীয়।"
  },
  {
    icon: Target,
    title: "স্বচ্ছতা",
    description: "সকল ভোটের ট্রানজ্যাকশন পাবলিক লেজারে দৃশ্যমান এবং যাচাইযোগ্য।"
  },
  {
    icon: Zap,
    title: "দক্ষতা",
    description: "দ্রুত এবং নির্ভুল ফলাফল প্রদান করে সময় ও সম্পদ সাশ্রয়।"
  },
  {
    icon: Globe,
    title: "প্রবেশযোগ্যতা",
    description: "যেকোনো স্থান থেকে ইন্টারনেট সংযোগের মাধ্যমে ভোট দেওয়া সম্ভব।"
  }
];

const team = [
  { name: "ড. আহমেদ করিম", role: "প্রতিষ্ঠাতা ও সিইও", expertise: "ব্লকচেইন বিশেষজ্ঞ" },
  { name: "সাবরিনা রহমান", role: "চিফ টেকনোলজি অফিসার", expertise: "AI ও মেশিন লার্নিং" },
  { name: "মোঃ রফিকুল ইসলাম", role: "নিরাপত্তা প্রধান", expertise: "সাইবার সিকিউরিটি" },
  
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <img src={bdVoteLogo} alt="BD Vote" className="h-24 w-auto mx-auto mb-6" />
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">আমাদের সম্পর্কে</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              BD Vote বাংলাদেশের প্রথম ব্লকচেইন-ভিত্তিক ই-ভোটিং প্ল্যাটফর্ম যা নির্বাচনী প্রক্রিয়াকে আরও নিরাপদ, স্বচ্ছ এবং সহজলভ্য করতে প্রতিশ্রুতিবদ্ধ।
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="size-7 text-primary" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold">আমাদের লক্ষ্য</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  আমাদের লক্ষ্য হলো বাংলাদেশে গণতান্ত্রিক প্রক্রিয়াকে আধুনিক প্রযুক্তির মাধ্যমে শক্তিশালী করা। 
                  আমরা বিশ্বাস করি যে প্রতিটি নাগরিকের ভোট মূল্যবান এবং সেটি অবশ্যই সুরক্ষিত থাকা উচিত। 
                  ব্লকচেইন এবং AI প্রযুক্তি ব্যবহার করে আমরা এমন একটি সিস্টেম তৈরি করেছি যেখানে ভোট কারচুপি অসম্ভব এবং ফলাফল সম্পূর্ণ স্বচ্ছ।
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">আমাদের মূল্যবোধ</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <value.icon className="size-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">আমাদের দল</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="size-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="size-10 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-primary mb-1">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.expertise}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <Card className="bg-gradient-to-r from-primary to-primary/80">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-primary-foreground">
                  <div>
                    <p className="text-4xl font-bold mb-2">১০+</p>
                    <p className="text-sm opacity-90">সফল নির্বাচন</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-2">৫০,০০০+</p>
                    <p className="text-sm opacity-90">নিবন্ধিত ভোটার</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-2">৯৯.৯%</p>
                    <p className="text-sm opacity-90">আপটাইম</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-2">০</p>
                    <p className="text-sm opacity-90">নিরাপত্তা লঙ্ঘন</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
