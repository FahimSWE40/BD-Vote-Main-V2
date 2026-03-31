import { motion } from "framer-motion";
import { FileText, AlertCircle, CheckSquare, Ban, Scale, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const sections = [
  {
    icon: CheckSquare,
    title: "সেবার শর্তাবলী",
    content: `BD Vote প্ল্যাটফর্ম ব্যবহার করে আপনি নিম্নলিখিত শর্তাবলীতে সম্মত হচ্ছেন:

১. আপনি বাংলাদেশের নাগরিক এবং ভোট দেওয়ার যোগ্যতা রাখেন।

২. আপনি সঠিক এবং সত্য তথ্য প্রদান করবেন।

৩. আপনি শুধুমাত্র নিজের পক্ষে ভোট দেবেন, অন্যের পক্ষে নয়।

৪. আপনি প্ল্যাটফর্মের নিরাপত্তা ভঙ্গ করার চেষ্টা করবেন না।

৫. আপনি এই শর্তাবলী এবং প্রাইভেসি পলিসি মেনে চলবেন।`
  },
  {
    icon: FileText,
    title: "ব্যবহারের অধিকার",
    content: `BD Vote আপনাকে নিম্নলিখিত অধিকার প্রদান করে:

• **ভোট প্রদান**: যোগ্য নির্বাচনে আপনার ভোট দেওয়ার অধিকার।

• **ফলাফল দেখা**: রিয়েল-টাইম এবং চূড়ান্ত ফলাফল দেখার অধিকার।

• **যাচাই করা**: আপনার ভোট ব্লকচেইনে সঠিকভাবে রেকর্ড হয়েছে কি না তা যাচাই করার অধিকার।

• **সাপোর্ট**: প্রযুক্তিগত সহায়তা পাওয়ার অধিকার।

এই অধিকারগুলো শর্তাবলী মেনে চলা সাপেক্ষে প্রযোজ্য।`
  },
  {
    icon: Ban,
    title: "নিষিদ্ধ কার্যক্রম",
    content: `নিম্নলিখিত কার্যক্রম কঠোরভাবে নিষিদ্ধ:

❌ মিথ্যা পরিচয় ব্যবহার করে ভোট দেওয়া

❌ একাধিকবার ভোট দেওয়ার চেষ্টা

❌ অন্যের পক্ষে ভোট দেওয়া

❌ সিস্টেম হ্যাক বা ম্যানিপুলেট করার চেষ্টা

❌ ভোটারদের ভয় দেখানো বা প্রভাবিত করা

❌ ভোট বিক্রি বা ক্রয় করা

এই নিয়ম লঙ্ঘনে আইনি ব্যবস্থা গ্রহণ করা হবে।`
  },
  {
    icon: AlertCircle,
    title: "দায়বদ্ধতার সীমাবদ্ধতা",
    content: `BD Vote নিম্নলিখিত বিষয়ে দায়বদ্ধ নয়:

• ইন্টারনেট সংযোগ বিচ্ছিন্নতার কারণে ভোট প্রদানে ব্যর্থতা।

• ব্যবহারকারীর ডিভাইস বা ব্রাউজার সংক্রান্ত সমস্যা।

• ভুল তথ্য প্রদানের কারণে ভেরিফিকেশন ব্যর্থতা।

• থার্ড-পার্টি সেবা প্রদানকারীদের সমস্যা।

আমরা সর্বোচ্চ চেষ্টা করি সেবার মান বজায় রাখতে, তবে ১০০% আপটাইমের গ্যারান্টি দিতে পারি না।`
  },
  {
    icon: Scale,
    title: "বিরোধ নিষ্পত্তি",
    content: `যেকোনো বিরোধের ক্ষেত্রে:

১. প্রথমে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।

২. সমাধান না হলে আনুষ্ঠানিক অভিযোগ দায়ের করুন।

৩. অভিযোগ ১৫ কার্যদিবসের মধ্যে পর্যালোচনা করা হবে।

৪. চূড়ান্ত সিদ্ধান্ত বাংলাদেশের আইন অনুযায়ী নেওয়া হবে।

সকল বিরোধ বাংলাদেশের আদালতের এখতিয়ারভুক্ত।`
  }
];

export default function Terms() {
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">শর্তাবলী</h1>
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
                  BD Vote ই-ভোটিং প্ল্যাটফর্মে স্বাগতম। এই শর্তাবলী আমাদের সেবা ব্যবহারের নিয়মাবলী নির্ধারণ করে। প্ল্যাটফর্ম ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন। অনুগ্রহ করে সম্পূর্ণ পড়ুন।
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

          {/* Acceptance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12"
          >
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-8 text-center">
                <CheckSquare className="size-12 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">শর্তাবলী স্বীকার</h3>
                <p className="text-muted-foreground">
                  BD Vote প্ল্যাটফর্ম ব্যবহার করে আপনি এই শর্তাবলী এবং আমাদের প্রাইভেসি পলিসি সম্পূর্ণরূপে পড়েছেন এবং সম্মত হয়েছেন বলে ধরে নেওয়া হবে।
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="size-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">প্রশ্ন আছে?</h3>
                <p className="text-muted-foreground mb-4">
                  শর্তাবলী সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন।
                </p>
                <a href="mailto:legal@bdvote.com" className="text-primary hover:underline font-medium">
                  legal@bdvote.com
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
