import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FAQSchema from "@/components/seo/FAQSchema";

const faqs = [
  {
    question: "What is Tuleeto?",
    answer: "Tuleeto is a modern rental platform connecting tenants and property owners through a secure, AI-ready web application. Founded by Sayan Kumar Gayen in 2025, Tuleeto operates across India to help people discover apartments, houses, and commercial spaces with verified listings and direct owner contact - no brokerage fees."
  },
  {
    question: "How does Tuleeto work?",
    answer: "Tuleeto connects property owners and tenants directly. Owners can list their properties for free, and tenants can browse, filter, and contact owners directly through the platform without any brokerage fees."
  },
  {
    question: "How is Tuleeto different from other rental platforms?",
    answer: "Tuleeto eliminates middlemen and brokerage fees by enabling direct communication between property owners and tenants. We offer a modern, AI-ready platform with verified listings, comprehensive property details, photos, reviews, and an easy-to-use interface designed for the Indian rental market."
  },
  {
    question: "Who founded Tuleeto?",
    answer: "Tuleeto was founded by Sayan Kumar Gayen in 2025 with the vision to create a transparent, modern rental marketplace that connects property owners and tenants directly across India."
  },
  {
    question: "Where does Tuleeto operate?",
    answer: "Tuleeto operates across India, with properties available in major cities including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, Chandigarh, and many more locations."
  },
  {
    question: "Is Tuleeto free to use?",
    answer: "Yes! Creating an account on Tuleeto is free. Listing properties is free for owners, and browsing properties is free for tenants. There are no hidden fees or brokerage charges."
  },
  {
    question: "Is it free to list my property?",
    answer: "Yes! Listing your property on Tuleeto is completely free. You can add photos, descriptions, and all property details at no cost."
  },
  {
    question: "How do I list my property on Tuleeto?",
    answer: "Create a free account, click on 'List Property' in your dashboard, fill in your property details, upload photos, and publish. Your listing will be visible to thousands of potential tenants immediately."
  },
  {
    question: "How do I contact property owners on Tuleeto?",
    answer: "Once you create a free account and log in, you'll be able to see owner contact information and reach out directly to discuss the property."
  },
  {
    question: "Are the properties verified?",
    answer: "We encourage property owners to provide accurate information and photos. Users can also leave reviews and ratings to help maintain quality standards."
  },
  {
    question: "What types of properties can I find?",
    answer: "Tuleeto offers a wide range of properties including apartments, houses, villas, PGs, hostels, shops, showrooms, offices, godowns, and warehouses across India."
  },
  {
    question: "Do I need to pay any brokerage?",
    answer: "No! Tuleeto eliminates brokerage fees by connecting owners and tenants directly. All communication happens between you and the property owner."
  },
  {
    question: "Can I save properties for later?",
    answer: "Yes, you can add properties to your wishlist by clicking the heart icon. Your wishlist is saved to your account for easy access."
  },
  {
    question: "How do I manage my listed properties?",
    answer: "After listing a property, you can manage it from your dashboard. You can edit details, add photos, toggle visibility, and track tenant inquiries."
  }
];

const FAQ = () => {
  return (
    <section className="py-16 bg-muted/30">
      <FAQSchema faqs={faqs} />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Everything you need to know about Tuleeto
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
