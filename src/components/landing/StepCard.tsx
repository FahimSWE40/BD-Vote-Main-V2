import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StepCardProps {
  step: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

export function StepCard({ step, title, desc, icon, color }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card className="h-full text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6 pt-8">
          {/* Step Number Circle */}
          <div className={`size-20 ${color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            <span className="material-symbols-outlined text-white text-3xl">{icon}</span>
          </div>
          
          {/* Step Badge */}
          <div className="inline-flex items-center justify-center bg-muted text-muted-foreground text-sm font-bold px-3 py-1 rounded-full mb-4">
            ধাপ {step}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
