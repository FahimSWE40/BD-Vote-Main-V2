import { motion } from "framer-motion";
import { 
  Camera, 
  UserCheck, 
  Vote, 
  CheckCircle, 
  ArrowRight,
  Smartphone,
  Wifi,
  IdCard,
  Shield,
  HelpCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const steps = [
  {
    number: "০১",
    icon: IdCard,
    title: "আইডি কার্ড প্রস্তুত করুন",
    description: "আপনার ইউনিভার্সিটি/প্রতিষ্ঠানের আইডি কার্ড হাতে রাখুন। কার্ডটি পরিষ্কার এবং পাঠযোগ্য হতে হবে।"
  },
  {
    number: "০২",
    icon: Camera,
    title: "আইডি স্ক্যান করুন",
    description: "ক্যামেরার সামনে আইডি কার্ডটি ধরুন। আমাদের OCR সিস্টেম স্বয়ংক্রিয়ভাবে তথ্য পড়বে।"
  },
  {
    number: "০৩",
    icon: UserCheck,
    title: "ফেস ভেরিফিকেশন",
    description: "ক্যামেরার দিকে তাকান। AI আপনার চেহারা আইডি কার্ডের ছবির সাথে মিলিয়ে দেখবে।"
  },
  {
    number: "০৪",
    icon: Vote,
    title: "প্রার্থী নির্বাচন",
    description: "ডিজিটাল ব্যালটে আপনার পছন্দের প্রার্থী নির্বাচন করুন।"
  },
  {
    number: "০৫",
    icon: CheckCircle,
    title: "ভোট নিশ্চিত করুন",
    description: "আপনার নির্বাচন চূড়ান্ত করুন। ভোট ব্লকচেইনে সংরক্ষিত হবে।"
  }
];

const requirements = [
  { icon: Smartphone, text: "স্মার্টফোন বা কম্পিউটার" },
  { icon: Wifi, text: "ইন্টারনেট সংযোগ" },
  { icon: Camera, text: "ওয়েবক্যাম/ক্যামেরা" },
  { icon: IdCard, text: "বৈধ আইডি কার্ড" }
];

const faqs = [
  {
    question: "ভোট দিতে কতক্ষণ সময় লাগে?",
    answer: "পুরো প্রক্রিয়াটি সাধারণত ২-৩ মিনিটের মধ্যে সম্পন্ন হয়।"
  },
  {
    question: "ভেরিফিকেশন ব্যর্থ হলে কী করব?",
    answer: "ভালো আলোতে পুনরায় চেষ্টা করুন। সমস্যা থাকলে হেল্প সেন্টারে যোগাযোগ করুন।"
  },
  {
    question: "একাধিকবার ভোট দেওয়া যাবে?",
    answer: "না, ব্লকচেইন প্রযুক্তি নিশ্চিত করে যে প্রতিটি ভোটার শুধুমাত্র একবার ভোট দিতে পারবে।"
  }
];

export default function HowToVote() {
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">কিভাবে ভোট দেবেন</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              BD Vote-এ ভোট দেওয়া সহজ এবং নিরাপদ। নিচের ধাপগুলো অনুসরণ করুন।
            </p>
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">প্রয়োজনীয় জিনিসপত্র</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {requirements.map((req, index) => (
                <Card key={index}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <req.icon className="size-6 text-primary" />
                    </div>
                    <p className="font-medium">{req.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-12">ভোট দেওয়ার ধাপসমূহ</h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className="bg-primary text-primary-foreground p-6 flex items-center justify-center min-w-[100px]">
                          <span className="text-3xl font-bold">{step.number}</span>
                        </div>
                        <div className="p-6 flex items-center gap-6 flex-1">
                          <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <step.icon className="size-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">সাধারণ প্রশ্নাবলী</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle className="size-5 text-primary shrink-0 mt-0.5" />
                      <h3 className="font-semibold">{faq.question}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-8 text-center">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="size-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">ভোট দিতে প্রস্তুত?</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  এখনই শুরু করুন এবং আপনার গণতান্ত্রিক অধিকার প্রয়োগ করুন। প্রক্রিয়াটি সম্পূর্ণ নিরাপদ এবং গোপনীয়।
                </p>
                <Button asChild size="lg">
                  <Link to="/verification">
                    ভেরিফিকেশন শুরু করুন
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
