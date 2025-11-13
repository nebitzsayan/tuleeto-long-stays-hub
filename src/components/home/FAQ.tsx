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
    answer: "Tuleeto is a modern rental platform connecting tenants and property owners through a secure, AI-ready web application. We help you discover, book, and list residential and commercial properties across India."
  },
  {
    question: "How does Tuleeto work?",
    answer: "Tuleeto allows property owners to list their properties for free, while tenants can browse verified listings, filter by location and preferences, and directly contact owners. Our platform ensures transparency and ease of communication between both parties."
  },
  {
    question: "Is Tuleeto free to use?",
    answer: "Yes, Tuleeto is completely free for both property seekers and owners. You can browse listings, contact owners, and list your properties without any charges."
  },
  {
    question: "What types of properties can I find on Tuleeto?",
    answer: "Tuleeto offers a wide range of properties including apartments, houses, villas, PG accommodations, hostels, commercial spaces like shops, showrooms, offices, godowns, and warehouses across India."
  },
  {
    question: "How do I list my property on Tuleeto?",
    answer: "Simply create an account, click on 'List Property', fill in your property details, upload photos, and publish your listing. Your property will be visible to thousands of potential tenants immediately."
  },
  {
    question: "Are the property listings verified?",
    answer: "We encourage direct owner listings and provide tools for users to verify property authenticity. Tenants can contact owners directly, view detailed photos, and check reviews before making decisions."
  },
  {
    question: "Can I search for properties by location?",
    answer: "Yes, Tuleeto offers powerful location-based search. You can use your current location to find nearby properties or search by city, area, or landmark. Our system shows properties sorted by distance from your location."
  },
  {
    question: "How do I contact property owners?",
    answer: "Each property listing displays the owner's contact information. You can directly call or message the owner through the provided contact details on the property page."
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
