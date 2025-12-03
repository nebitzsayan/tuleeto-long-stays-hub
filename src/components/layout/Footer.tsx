
import { Link } from "react-router-dom";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 mt-auto border-t border-gray-200">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row items-start justify-between space-y-4 md:space-y-0 gap-8">
          {/* Brand with Description */}
          <div className="text-center md:text-left max-w-xs mx-auto md:mx-0">
            <div className="flex justify-center md:justify-start mb-3">
              <Logo />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              India&apos;s trusted rental marketplace connecting property owners with verified tenants for apartments, houses, villas, and commercial spaces.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-6 flex-wrap justify-center md:justify-end">
            <Link to="/listings" className="text-gray-700 hover:text-tuleeto-orange transition-colors">Browse Properties</Link>
            <Link to="/terms" className="text-gray-700 hover:text-tuleeto-orange transition-colors">Terms of Service</Link>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 text-center text-gray-600 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Tuleeto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
