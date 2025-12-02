import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const OwnerCTA = () => {
  const benefits = [
    "Free listing creation",
    "Direct communication",
    "No booking fees",
    "Verified renters",
  ];

  return (
    <section className="bg-tuleeto-orange py-12 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="text-white">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              Own a Property?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 opacity-95 leading-relaxed">
              List your property on Tuleeto and connect with reliable long-term renters looking for their next home.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
                  <span className="text-base md:text-lg lg:text-xl font-medium">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - CTA Button */}
          <div className="flex justify-center lg:justify-end">
            <Button
              asChild
              size="lg"
              className="bg-white text-tuleeto-orange hover:bg-white/95 text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 h-auto rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 font-bold"
            >
              <Link to="/list-property" className="flex items-center">
                List Your Property
                <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerCTA;
