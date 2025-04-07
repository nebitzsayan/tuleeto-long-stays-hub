
import { Home } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ListingSteps } from "@/components/property/ListingSteps";
import PropertyListingForm, { steps } from "@/components/property/PropertyListingForm";
import { useState } from "react";

const ListPropertyPage = () => {
  const [step, setStep] = useState(0);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 pb-16 bg-tuleeto-off-white">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Home className="h-12 w-12 text-tuleeto-orange" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">List Your Property</h1>
            <p className="text-gray-600">
              Fill out the form below to list your property for rent on Tuleeto
            </p>
          </div>
          
          {/* Progress Steps */}
          <ListingSteps currentStep={step} />
          
          {/* Form */}
          <PropertyListingForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ListPropertyPage;
