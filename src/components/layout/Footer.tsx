
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Logo className="mb-4" />
            <p className="text-gray-400 mb-4">
              Find your perfect long-term home with Tuleeto. We connect renters and property owners directly.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-tuleeto-orange">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-tuleeto-orange">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-tuleeto-orange">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/listings" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Browse Rentals
                </Link>
              </li>
              <li>
                <Link to="/list-property" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-gray-400 hover:text-tuleeto-orange transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-400">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>nebitztechnology@gmail.com</span>
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>+91 8918278737</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Tuleeto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
