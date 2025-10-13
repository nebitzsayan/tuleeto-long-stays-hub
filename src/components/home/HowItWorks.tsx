
import { Search, FileText, MessageCircle, Users, FileSpreadsheet, Image, Home } from "lucide-react";

const steps = [
  {
    icon: <Search className="h-12 w-12 text-tuleeto-orange" />,
    title: "Find Your Ideal Home",
    description:
      "Search our extensive listings to find the perfect long-term rental that meets all your needs and preferences."
  },
  {
    icon: <MessageCircle className="h-12 w-12 text-tuleeto-orange" />,
    title: "Connect Directly",
    description:
      "Reach out directly to property owners through our secure messaging system to ask questions and arrange viewings."
  },
  {
    icon: <FileText className="h-12 w-12 text-tuleeto-orange" />,
    title: "Move In With Confidence",
    description:
      "Complete the rental agreement and prepare to move into your new long-term home with peace of mind."
  },
  {
    icon: <Home className="h-12 w-12 text-tuleeto-orange" />,
    title: "Manage Multiple Properties",
    description:
      "Easily manage all your rental properties in one place. Track tenants, payments, and property details with a single dashboard."
  },
  {
    icon: <Users className="h-12 w-12 text-tuleeto-orange" />,
    title: "Tenant Payment Management",
    description:
      "Track rent, electricity, water bills, and other charges. Mark payments as paid/unpaid and maintain complete payment history."
  },
  {
    icon: <FileSpreadsheet className="h-12 w-12 text-tuleeto-orange" />,
    title: "Excel Export Support",
    description:
      "Export all tenant and payment data to Excel spreadsheets with one click for easy reporting and record-keeping."
  },
  {
    icon: <Image className="h-12 w-12 text-tuleeto-orange" />,
    title: "Built-in Poster Generation",
    description:
      "Create professional property advertisement posters instantly with QR codes and property details for easy sharing."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Tuleeto Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Finding your perfect long-term rental is simple with our straightforward process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-lg bg-tuleeto-off-white transition-transform hover:scale-105 duration-300"
            >
              <div className="bg-white p-4 rounded-full shadow-md mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              <div className="mt-6 text-4xl font-bold text-tuleeto-orange-light">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
