
import { CheckCircle2 } from "lucide-react";
import { steps } from "./PropertyListingForm";

interface ListingStepsProps {
  currentStep: number;
}

export const ListingSteps = ({ currentStep }: ListingStepsProps) => {
  return (
    <div className="mb-10">
      <div className="flex justify-between">
        {steps.map((s, i) => (
          <div 
            key={s.id} 
            className={`flex flex-col items-center ${i > 0 && "flex-1"}`}
          >
            <div className="relative flex items-center">
              <div 
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 
                ${i === currentStep 
                  ? "border-tuleeto-orange bg-tuleeto-orange text-white" 
                  : i < currentStep 
                    ? "border-tuleeto-orange bg-tuleeto-orange/20 text-tuleeto-orange"
                    : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {i < currentStep ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              
              {i < steps.length - 1 && (
                <div 
                  className={`absolute top-5 h-0.5 w-full left-0 -z-10 
                  ${i < currentStep ? "bg-tuleeto-orange" : "bg-gray-300"}`}
                ></div>
              )}
            </div>
            <span className={`text-xs mt-2 ${i === currentStep ? "text-tuleeto-orange font-medium" : "text-gray-500"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
