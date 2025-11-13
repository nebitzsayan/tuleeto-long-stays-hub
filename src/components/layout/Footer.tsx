
import { Link } from "react-router-dom";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 mt-auto border-t border-gray-200">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Logo className="mb-2" />
          </div>

          {/* Navigation Links */}
          <div className="flex gap-6 flex-wrap justify-center">
            <Link to="/about" className="text-gray-700 hover:text-tuleeto-orange transition-colors">About</Link>
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
