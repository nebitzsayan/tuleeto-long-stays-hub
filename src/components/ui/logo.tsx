
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = "", showText = true }: LogoProps) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/images-resources/d5b8b33e-0c09-4345-8859-4dc176bc39a3.png"
        alt="Tuleeto Logo" 
        className="h-8 w-auto"
      />
      {showText && <span className="text-xl md:text-2xl font-bold text-tuleeto-orange">Tuleeto</span>}
    </Link>
  );
};

export default Logo;
