import { motion } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  Key, 
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const securityFeatures = [
  {
    icon: Lock,
    title: "এন্ড-টু-এন্ড এনক্রিপশন",
    description: "সমস্ত ডাটা AES-256 এনক্রিপশন দ্বারা সুরক্ষিত। ট্রান্সমিশনের সময় SSL/TLS প্রোটোকল ব্যবহৃত হয়।"
  },
  {
    icon: Database,
    title: "ব্লকচেইন স্টোরেজ",
    description: "ভোটের রেকর্ড বিকেন্দ্রীকৃত ব্লকচেইনে সংরক্ষিত থাকে, যা কোনো একক সত্তা দ্বারা পরিবর্তন করা অসম্ভব।"
  },
  {
    icon: Fingerprint,
    title: "বায়োমেট্রিক ভেরিফিকেশন",
    description: "AI-চালিত ফেস রিকগনিশন প্রতিটি ভোটারের পরিচয় নিশ্চিত করে।"
  },
  {
    icon: Eye,
    title: "অডিট ট্রেইল",
    description: "প্রতিটি অ্যাকশন লগ করা হয় এবং স্বতন্ত্র অডিটরদের দ্বারা যাচাইযোগ্য।"
  },
  {
    icon: Server,
    title: "ডিস্ট্রিবিউটেড নোড",
    description: "১২৮+ নোডের নেটওয়ার্ক সিস্টেমের নির্ভরযোগ্যতা এবং আপটাইম নিশ্চিত করে।"
  },
  {
    icon: Key,
    title: "জিরো-নলেজ প্রুফ",
    description: "ভোটারের পছন্দ গোপন রাখার পাশাপাশি ভোটের বৈধতা প্রমাণ করে।"
  }
];

const certifications = [
  "ISO 27001 সার্টিফাইড",
  "SOC 2 Type II কমপ্লায়েন্ট",
  "GDPR সম্মত",
  "বাংলাদেশ ইলেকশন কমিশন অনুমোদিত"
];

const protocols = [
  {
    title: "ভোটার গোপনীয়তা",
    items: [
      "ভোটারের পরিচয় এবং ভোটের মধ্যে কোনো সংযোগ নেই",
      "ভোটের ডাটা বেনামে সংরক্ষিত",
      "ব্যক্তিগত তথ্য এনক্রিপ্টেড"
    ]
  },
  {
    title: "সিস্টেম নিরাপত্তা",
    items: [
      "২৪/৭ নিরাপত্তা মনিটরিং",
      "DDoS প্রতিরোধ ব্যবস্থা",
      "নিয়মিত পেনেট্রেশন টেস্টিং"
    ]
  },
  {
    title: "ডাটা সুরক্ষা",
    items: [
      "মাল্টি-ফ্যাক্টর অথেনটিকেশন",
      "রেগুলার ব্যাকআপ সিস্টেম",
      "ডাটা রিডান্ডেন্সি"
    ]
  }
];

export default function Security() {
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
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="size-10 text-primary" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">নিরাপত্তা নীতিমালা</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              BD Vote-এ আপনার ভোট এবং ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার।
            </p>
          </motion.div>

          {/* Security Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">নিরাপত্তা বৈশিষ্ট্যসমূহ</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Protocols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">নিরাপত্তা প্রটোকল</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {protocols.map((protocol, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{protocol.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {protocol.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="size-4 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-center mb-8">সার্টিফিকেশন ও কমপ্লায়েন্স</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {certifications.map((cert, index) => (
                    <div key={index} className="bg-background rounded-lg p-4 text-center">
                      <FileCheck className="size-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{cert}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reporting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-warning/10 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle className="size-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">নিরাপত্তা সমস্যা রিপোর্ট করুন</h3>
                    <p className="text-muted-foreground mb-4">
                      আপনি যদি কোনো নিরাপত্তা দুর্বলতা বা সন্দেহজনক কার্যকলাপ লক্ষ্য করেন, অনুগ্রহ করে অবিলম্বে আমাদের জানান।
                    </p>
                    <p className="text-sm">
                      ইমেইল: <a href="mailto:security@bdvote.com" className="text-primary hover:underline">security@bdvote.com</a>
                    </p>
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
