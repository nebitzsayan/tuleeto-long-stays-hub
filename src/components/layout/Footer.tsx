
import { Link } from "react-router-dom";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#EDC3A4' }} className="text-gray-800 mt-auto">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Logo className="mb-2" />
          </div>

          {/* Terms of Service Link */}
          <div>
            <Link 
              to="/terms" 
              className="text-tuleeto-orange hover:text-tuleeto-orange-dark transition-colors duration-200 font-medium"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-4 pt-4 text-center text-gray-600 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Tuleeto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
