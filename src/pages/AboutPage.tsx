import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import { OrganizationSchema } from "@/components/seo/StructuredData";
import { Building2, Users, Shield, Zap, Heart, TrendingUp } from "lucide-react";

const AboutPage = () => {
  const features = [
    {
      icon: Building2,
      title: "Wide Range of Properties",
      description: "From apartments to commercial spaces, find every type of rental property across India."
    },
    {
      icon: Users,
      title: "Direct Owner Contact",
      description: "Connect directly with property owners without any middlemen or brokerage fees."
    },
    {
      icon: Shield,
      title: "Verified Listings",
      description: "Browse verified property listings with authentic photos and accurate information."
    },
    {
      icon: Zap,
      title: "AI-Ready Platform",
      description: "Modern, fast, and intelligent platform designed for the digital age."
    },
    {
      icon: Heart,
      title: "User-Friendly Experience",
      description: "Simple, intuitive interface that makes finding or listing properties effortless."
    },
    {
      icon: TrendingUp,
      title: "Growing Community",
      description: "Join thousands of property owners and tenants across India."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="About Tuleeto - India's Modern Rental Marketplace | Founded by Sayan Kumar Gayen"
        description="Learn about Tuleeto, the modern rental platform connecting property owners and tenants across India. Founded by Sayan Kumar Gayen in 2025 to eliminate brokerage fees and simplify property rentals."
        keywords="About Tuleeto, Tuleeto founder, Sayan Kumar Gayen, rental platform India, property marketplace, no brokerage"
      />
      <OrganizationSchema />
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                About Tuleeto - India's Modern Rental Marketplace
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                <strong>Tuleeto</strong> is a modern rental platform connecting tenants and property owners 
                through a secure, AI-ready web application.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  To revolutionize the Indian rental market by eliminating brokerage fees and creating 
                  a transparent, efficient platform where property owners and tenants can connect directly.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Founded by Sayan Kumar Gayen
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tuleeto was founded by <strong>Sayan Kumar Gayen</strong> on January 1, 2025, 
                  with a clear vision: to transform how people find and list rental properties in India. 
                  Frustrated by the traditional rental process plagued with brokerage fees and lack of transparency, 
                  Sayan created Tuleeto as a modern, digital-first solution.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, Tuleeto serves thousands of users across India, helping them discover apartments, 
                  houses, villas, and commercial spaces with complete transparency and zero brokerage fees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Why Choose Tuleeto?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're building the future of rental property discovery in India
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.title}
                    className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="inline-flex p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coverage Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Operating Across India
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Tuleeto operates in major cities across India including Mumbai, Delhi, Bangalore, 
                Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, Chandigarh, and many more locations. 
                Whether you're looking for a cozy apartment in Mumbai or a spacious villa in Bangalore, 
                Tuleeto connects you with property owners directly.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8">
                {["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh"].map((city) => (
                  <div key={city} className="bg-card border border-border rounded-lg p-4 text-center">
                    <span className="font-medium text-foreground">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Join Tuleeto Today
              </h2>
              <p className="text-lg text-muted-foreground">
                Whether you're searching for your next home or listing a property, 
                Tuleeto makes the rental process simple, transparent, and free of brokerage fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a 
                  href="/listings"
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Browse Properties
                </a>
                <a 
                  href="/list-property"
                  className="inline-flex items-center justify-center px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  List Your Property
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
