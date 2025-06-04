
import { Link } from "react-router-dom";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Logo className="mb-2" />
            <p className="text-gray-400 text-sm font-medium">
              Find your perfect long-term home with Tuleeto.
            </p>
          </div>

          {/* Terms of Service Link */}
          <div>
            <Link 
              to="/terms" 
              className="text-tuleeto-orange hover:text-tuleeto-orange-light transition-colors duration-200 font-medium"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-4 pt-4 text-center text-gray-500 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Tuleeto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
