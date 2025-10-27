
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import HowItWorks from "@/components/home/HowItWorks";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { RealEstateAgentSchema } from "@/components/seo/StructuredData";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SEO />
      <RealEstateAgentSchema />
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedProperties />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
