import { useState } from "react";
import { ArrowUpRight, Maximize2, Star } from "lucide-react";
import DiffModal from "./DiffModal";

interface SeoElement {
  type: string;
  original: string;
  optimized: string;
  confidence: number;
}

interface SeoCardProps {
  url: string;
  element: SeoElement;
  onApprove: (element: SeoElement) => void;
}

export default function SeoCard({ url, element, onApprove }: SeoCardProps) {
  const [showDiff, setShowDiff] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "title":
        return <Star className="h-4 w-4 text-amber-500" />;
      case "meta-description":
        return <Star className="h-4 w-4 text-blue-500" />;
      case "heading":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "alt-text":
        return <Star className="h-4 w-4 text-green-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatType = (type: string) => {
    // Convert types like "meta-description" to "Meta Description"
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              {getTypeIcon(element.type)}
              <h3 className="text-base font-semibold ml-2">
                {formatType(element.type)}
              </h3>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <div 
                className={`w-2 h-2 rounded-full mr-2 ${
                  element.confidence >= 80 
                    ? "bg-green-500" 
                    : element.confidence >= 60 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
                }`}
              ></div>
              <span>{element.confidence}% match</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Current</div>
            <div className="text-sm bg-muted p-2 rounded-md line-clamp-2">
              {element.original}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Suggested</div>
            <div className="text-sm bg-primary/5 border border-primary/10 p-2 rounded-md line-clamp-2">
              {element.optimized}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setShowDiff(true)}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-1.5" /> Compare
            </button>
            <button
              onClick={() => onApprove(element)}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" /> Apply Change
            </button>
          </div>
        </div>
      </div>

      {showDiff && (
        <DiffModal
          element={element}
          onClose={() => setShowDiff(false)}
          onApprove={() => {
            onApprove(element);
            setShowDiff(false);
          }}
        />
      )}
    </>
  );
} 