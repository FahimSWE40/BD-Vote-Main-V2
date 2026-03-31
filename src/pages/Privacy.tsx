import { motion } from "framer-motion";
import { Shield, Eye, Database, Lock, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const sections = [
  {
    icon: Database,
    title: "তথ্য সংগ্রহ",
    content: `আমরা নিম্নলিখিত তথ্য সংগ্রহ করি:

• **পরিচয় তথ্য**: নাম, আইডি নম্বর, ছবি (আইডি কার্ড থেকে)
• **বায়োমেট্রিক ডাটা**: ফেস ভেরিফিকেশনের জন্য মুখের বৈশিষ্ট্য
• **ভোটিং রেকর্ড**: ভোট প্রদানের সময় ও তারিখ (ভোটের বিষয়বস্তু নয়)
• **টেকনিক্যাল ডাটা**: ব্রাউজার তথ্য, আইপি অ্যাড্রেস

আমরা শুধুমাত্র ভোটিং প্রক্রিয়া সম্পন্ন করার জন্য প্রয়োজনীয় ন্যূনতম তথ্য সংগ্রহ করি।`
  },
  {
    icon: Lock,
    title: "তথ্য ব্যবহার",
    content: `সংগৃহীত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহৃত হয়:

• **পরিচয় যাচাই**: ভোটারের পরিচয় নিশ্চিত করা
• **দ্বৈত ভোট প্রতিরোধ**: একজন ভোটার একবারই ভোট দিতে পারবেন তা নিশ্চিত করা
• **অডিট ও স্বচ্ছতা**: নির্বাচনী প্রক্রিয়ার সততা যাচাই
• **সিস্টেম উন্নয়ন**: সেবার মান উন্নত করা

আমরা কখনই আপনার তথ্য বিজ্ঞাপন বা মার্কেটিং উদ্দেশ্যে ব্যবহার করি না।`
  },
  {
    icon: Eye,
    title: "তথ্য গোপনীয়তা",
    content: `আপনার ভোটের গোপনীয়তা সুরক্ষিত:

• **বেনামী ভোট**: ভোটার পরিচয় এবং ভোটের মধ্যে কোনো সংযোগ নেই
• **এনক্রিপশন**: সমস্ত তথ্য AES-256 দিয়ে এনক্রিপ্টেড
• **অ্যাক্সেস নিয়ন্ত্রণ**: শুধুমাত্র অনুমোদিত কর্মীরা সীমিত তথ্য দেখতে পারেন
• **কোনো ট্র্যাকিং নেই**: আপনি কাকে ভোট দিয়েছেন তা ট্র্যাক করা হয় না

জিরো-নলেজ প্রুফ প্রযুক্তি ব্যবহার করে আমরা আপনার ভোটের বৈধতা যাচাই করি, কিন্তু ভোটের বিষয়বস্তু কখনই প্রকাশ করি না।`
  },
  {
    icon: Shield,
    title: "তথ্য সুরক্ষা",
    content: `আপনার তথ্য সুরক্ষার জন্য আমরা নিম্নলিখিত ব্যবস্থা গ্রহণ করি:

• **SSL/TLS এনক্রিপশন**: ডাটা ট্রান্সমিশনে সুরক্ষা
• **ব্লকচেইন স্টোরেজ**: অপরিবর্তনীয় রেকর্ড
• **নিয়মিত অডিট**: থার্ড-পার্টি নিরাপত্তা মূল্যায়ন
• **২৪/৭ মনিটরিং**: রিয়েল-টাইম হুমকি সনাক্তকরণ

ISO 27001 এবং SOC 2 Type II সার্টিফিকেশন আমাদের নিরাপত্তা মানের প্রমাণ।`
  },
  {
    icon: FileText,
    title: "আপনার অধিকার",
    content: `আপনার নিম্নলিখিত অধিকার রয়েছে:

• **অ্যাক্সেস**: আপনার সম্পর্কে সংরক্ষিত তথ্য দেখার অধিকার
• **সংশোধন**: ভুল তথ্য সংশোধনের অনুরোধ
• **মুছে ফেলা**: নির্বাচন শেষে ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ
• **আপত্তি**: তথ্য প্রক্রিয়াকরণে আপত্তি জানানোর অধিকার

অনুগ্রহ করে মনে রাখবেন যে ব্লকচেইনে সংরক্ষিত ভোটিং রেকর্ড (বেনামী) মুছে ফেলা সম্ভব নয়, কারণ এটি নির্বাচনের সততা বজায় রাখতে প্রয়োজনীয়।`
  },
  {
    icon: Calendar,
    title: "তথ্য সংরক্ষণ",
    content: `তথ্য সংরক্ষণের সময়কাল:

• **ফেস ডাটা**: ভেরিফিকেশনের পরপরই মুছে ফেলা হয়
• **আইডি তথ্য**: নির্বাচন শেষে ৩০ দিন পর মুছে ফেলা হয়
• **ভোটিং রেকর্ড**: ব্লকচেইনে স্থায়ীভাবে সংরক্ষিত (বেনামী)
• **লগ ফাইল**: ৯০ দিন পর মুছে ফেলা হয়

আমরা শুধুমাত্র প্রয়োজনীয় সময়ের জন্যই তথ্য সংরক্ষণ করি।`
  }
];

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">প্রাইভেসি পলিসি</h1>
            <p className="text-lg text-muted-foreground">
              সর্বশেষ আপডেট: জানুয়ারি ২০২৬
            </p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-8">
                <p className="text-lg leading-relaxed">
                  BD Vote আপনার গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। এই প্রাইভেসি পলিসি ব্যাখ্যা করে কিভাবে আমরা আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি। আমাদের প্ল্যাটফর্ম ব্যবহার করে আপনি এই নীতিমালায় সম্মত হচ্ছেন।
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <section.icon className="size-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {section.content.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-4 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">প্রশ্ন আছে?</h3>
                <p className="text-muted-foreground mb-4">
                  প্রাইভেসি সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন।
                </p>
                <a href="mailto:privacy@bdvote.com" className="text-primary hover:underline font-medium">
                  privacy@bdvote.com
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
