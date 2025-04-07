
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import HowItWorks from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Featured Properties */}
        <FeaturedProperties />
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* List Your Property CTA */}
        <section className="py-16 px-4 bg-tuleeto-orange text-white">
          <div className="container max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 mb-8 md:mb-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Own a Property?</h2>
                <p className="text-lg opacity-90 mb-6">
                  List your property on Tuleeto and connect with reliable long-term renters looking for their next home.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Free listing creation</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Direct communication</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>No booking fees</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Verified renters</span>
                  </div>
                </div>
              </div>
              <div>
                <Link to="/list-property">
                  <Button className="bg-white text-tuleeto-orange hover:bg-tuleeto-gray-light px-8 py-6 text-lg">
                    List Your Property <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials/Trust Banner */}
        <section className="py-12 px-4 bg-tuleeto-off-white">
          <div className="container max-w-7xl mx-auto text-center">
            <h3 className="text-2xl font-semibold mb-8">Trusted by Renters and Property Owners Nationwide</h3>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              <div className="text-xl font-bold flex items-center">
                <Home className="h-6 w-6 mr-2 text-tuleeto-orange" />
                <span>HomeRentals</span>
              </div>
              <div className="text-xl font-bold">PropertyPros</div>
              <div className="text-xl font-bold">RentWise</div>
              <div className="text-xl font-bold">HousingHub</div>
              <div className="text-xl font-bold">LivingSpaces</div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
