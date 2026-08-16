import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyUsSection from "@/components/WhyUsSection";
import AnimatedBeam from "@/components/AnimatedBeam";
import StatsSection from "@/components/StatsSection";
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
        <WhyUsSection />
        <AnimatedBeam />
        <StatsSection />
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
