
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import HowItWorks from "@/components/home/HowItWorks";
import ExploreCities from "@/components/home/ExploreCities";
import BrowseByType from "@/components/home/BrowseByType";
import FAQ from "@/components/home/FAQ";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { OrganizationSchema, WebSiteSchema } from "@/components/seo/StructuredData";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SEO />
      <OrganizationSchema />
      <WebSiteSchema />
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedProperties />
        <ExploreCities />
        <BrowseByType />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
