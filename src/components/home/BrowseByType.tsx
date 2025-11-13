import { Link } from "react-router-dom";
import { Building2, Home, Castle, Store, Building, Briefcase } from "lucide-react";

const propertyTypes = [
  {
    type: "Apartment",
    icon: Building2,
    description: "Modern apartments and flats",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    type: "House",
    icon: Home,
    description: "Independent houses",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    type: "Villa",
    icon: Castle,
    description: "Luxury villas and bungalows",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    type: "Shop",
    icon: Store,
    description: "Commercial shops",
    gradient: "from-orange-500 to-red-500"
  },
  {
    type: "Showroom",
    icon: Building,
    description: "Retail showrooms",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    type: "Office",
    icon: Briefcase,
    description: "Office spaces",
    gradient: "from-indigo-500 to-blue-500"
  },
];

const BrowseByType = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Browse Properties by Type on Tuleeto
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From residential apartments to commercial spaces - find the perfect property type for your needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {propertyTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.type}
                to={`/listings?type=${item.type}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="p-6 space-y-4">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${item.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.type} for Rent
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-sm text-primary font-medium group-hover:underline">
                    Browse {item.type}s →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrowseByType;
