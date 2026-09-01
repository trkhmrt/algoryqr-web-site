import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import SmartChefCompareSection from "@/components/SmartChefCompareSection";
import MenuComplianceSection from "@/components/MenuComplianceSection";
import GlobalMenuSection from "@/components/GlobalMenuSection";
import SmartSummarySection from "@/components/SmartSummarySection";
import WhyUsSection from "@/components/WhyUsSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FaqSection from "@/components/FaqSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import type { StoredUser } from "@/lib/api";

interface IndexProps {
  initialUser?: StoredUser | null;
}

const Index = ({ initialUser = null }: IndexProps) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar initialUser={initialUser} />
      <main className="w-full">
        <HeroSection />
        <HowItWorksSection />
        <SmartChefCompareSection />
        <MenuComplianceSection />
        <GlobalMenuSection />
        <SmartSummarySection />
        <WhyUsSection />
        <PricingSection initialUser={initialUser} />
        <TestimonialsSection />
        <FaqSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
