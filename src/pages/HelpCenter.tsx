import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Phone, 
  Mail,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  BookOpen,
  Send,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "নাম অন্তত ২ অক্ষরের হতে হবে" }),
  email: z.string().email({ message: "সঠিক ইমেইল ঠিকানা দিন" }),
  subject: z.string().min(1, { message: "বিষয় নির্বাচন করুন" }),
  message: z.string().min(10, { message: "বার্তা অন্তত ১০ অক্ষরের হতে হবে" }).max(1000, { message: "বার্তা ১০০০ অক্ষরের বেশি হতে পারবে না" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const subjectOptions = [
  { value: "verification", label: "ভেরিফিকেশন সমস্যা" },
  { value: "voting", label: "ভোট প্রদান সংক্রান্ত" },
  { value: "account", label: "অ্যাকাউন্ট সমস্যা" },
  { value: "technical", label: "টেকনিক্যাল সমস্যা" },
  { value: "feedback", label: "মতামত ও পরামর্শ" },
  { value: "other", label: "অন্যান্য" },
];

const categories = [
  { icon: FileText, title: "শুরু করুন", count: 8 },
  { icon: HelpCircle, title: "সাধারণ প্রশ্ন", count: 15 },
  { icon: Video, title: "ভিডিও টিউটোরিয়াল", count: 6 },
  { icon: BookOpen, title: "গাইড ও ডকুমেন্টেশন", count: 12 }
];

const faqs = [
  {
    question: "BD Vote-এ কিভাবে রেজিস্ট্রেশন করব?",
    answer: "BD Vote-এ আলাদা রেজিস্ট্রেশনের প্রয়োজন নেই। আপনার ইউনিভার্সিটি আইডি কার্ড এবং ফেস ভেরিফিকেশনের মাধ্যমে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্ট তৈরি হবে।"
  },
  {
    question: "আমার ভোট কি গোপন থাকবে?",
    answer: "হ্যাঁ, আপনার ভোট সম্পূর্ণ গোপন। আমাদের জিরো-নলেজ প্রুফ প্রযুক্তি নিশ্চিত করে যে কেউ জানতে পারবে না আপনি কাকে ভোট দিয়েছেন।"
  },
  {
    question: "ভেরিফিকেশন ব্যর্থ হলে কী করব?",
    answer: "ভালো আলোতে পুনরায় চেষ্টা করুন। আইডি কার্ডটি পরিষ্কার এবং সম্পূর্ণ দৃশ্যমান রাখুন। সমস্যা থাকলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।"
  },
  {
    question: "ভোট দেওয়ার পর কি পরিবর্তন করা যায়?",
    answer: "না, একবার ভোট দেওয়ার পর তা পরিবর্তন করা যায় না। ব্লকচেইন প্রযুক্তি ভোটকে স্থায়ী এবং অপরিবর্তনীয় করে।"
  },
  {
    question: "আমি কি মোবাইল থেকে ভোট দিতে পারব?",
    answer: "হ্যাঁ, BD Vote যেকোনো আধুনিক ব্রাউজার থেকে অ্যাক্সেসযোগ্য। মোবাইল, ট্যাবলেট বা কম্পিউটার - যেকোনো ডিভাইস থেকে ভোট দিতে পারবেন।"
  },
  {
    question: "ভোটের ফলাফল কখন দেখা যাবে?",
    answer: "ভোটগ্রহণ চলাকালীন লাইভ রেজাল্ট ড্যাশবোর্ডে রিয়েল-টাইম আপডেট দেখা যাবে।"
  }
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: "লাইভ চ্যাট",
    description: "তাৎক্ষণিক সাহায্যের জন্য",
    action: "চ্যাট শুরু করুন",
    available: "২৪/৭ উপলব্ধ"
  },
  {
    icon: Phone,
    title: "ফোন সাপোর্ট",
    description: "সরাসরি কথা বলুন",
    action: "০১৭XX-XXXXXX",
    available: "সকাল ৯টা - রাত ৯টা"
  },
  {
    icon: Mail,
    title: "ইমেইল সাপোর্ট",
    description: "বিস্তারিত সমস্যার জন্য",
    action: "support@bdvote.com",
    available: "২৪ ঘণ্টার মধ্যে উত্তর"
  }
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    // Simulate form submission
    console.log("Form submitted:", data);
    setIsSubmitted(true);
    toast({
      title: "বার্তা পাঠানো হয়েছে!",
      description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
    });
    form.reset();
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">হেল্প সেন্টার</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              আপনার প্রশ্নের উত্তর খুঁজুন বা আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="আপনার প্রশ্ন লিখুন..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {categories.map((category, index) => (
              <Card key={index} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <category.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.count}টি আর্টিকেল</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-8">সচরাচর জিজ্ঞাসা</h2>
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-0">
                    <button
                      className="w-full p-6 flex items-center justify-between text-left"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <span className="font-medium pr-4">{faq.question}</span>
                      {openFaq === index ? (
                        <ChevronUp className="size-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="size-5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-8">যোগাযোগ করুন</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {contactOptions.map((option, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <option.icon className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                    <p className="text-primary font-medium mb-2">{option.action}</p>
                    <p className="text-xs text-muted-foreground">{option.available}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">সাপোর্ট রিকোয়েস্ট পাঠান</CardTitle>
                <p className="text-muted-foreground">
                  আপনার সমস্যা বা প্রশ্ন বিস্তারিত লিখুন। আমাদের টিম দ্রুত আপনাকে সাহায্য করবে।
                </p>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="size-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">বার্তা পাঠানো হয়েছে!</h3>
                    <p className="text-muted-foreground">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>আপনার নাম *</FormLabel>
                              <FormControl>
                                <Input placeholder="মোহাম্মদ আলী" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ইমেইল ঠিকানা *</FormLabel>
                              <FormControl>
                                <Input placeholder="example@email.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>বিষয় *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjectOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>আপনার বার্তা *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="আপনার সমস্যা বা প্রশ্ন বিস্তারিত লিখুন..."
                                className="min-h-[150px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="lg" className="w-full md:w-auto">
                        <Send className="size-4 mr-2" />
                        বার্তা পাঠান
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
