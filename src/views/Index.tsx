import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AnimatedBeam from "@/components/AnimatedBeam";
import StepsCombined from "@/components/steps/StepsCombined";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import type { PlanPackageApiItem, StoredUser } from "@/lib/api";

interface IndexProps {
  initialUser?: StoredUser | null;
  packages?: PlanPackageApiItem[];
}

const Index = ({ initialUser = null, packages = [] }: IndexProps) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar initialUser={initialUser} />
      <main className="w-full">
        <HeroSection />
        <FeaturesSection />
        <AnimatedBeam />
        <StepsCombined />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection packages={packages} />
        <FaqSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
