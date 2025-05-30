import { useEffect, useRef } from "react";
import { X, Check } from "lucide-react";

interface SeoElement {
  type: string;
  original: string;
  optimized: string;
  confidence: number;
}

interface DiffModalProps {
  element: SeoElement;
  onClose: () => void;
  onApprove: () => void;
}

export default function DiffModal({ element, onClose, onApprove }: DiffModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    // Disable body scroll
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      
      // Re-enable body scroll
      document.body.style.overflow = "unset";
    };
  }, [onClose]);
  
  const formatType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Find the differences between original and optimized text
  const highlightDifferences = (original: string, optimized: string) => {
    const words1 = original.split(" ");
    const words2 = optimized.split(" ");
    
    const diffResult = [];
    let i = 0, j = 0;
    
    while (i < words1.length || j < words2.length) {
      if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
        diffResult.push({ value: words2[j], added: false, removed: false });
        i++;
        j++;
      } else {
        // Check if word is added in optimized text
        if (j < words2.length && (i >= words1.length || words1.indexOf(words2[j]) === -1)) {
          diffResult.push({ value: words2[j], added: true, removed: false });
          j++;
        } 
        // Check if word is removed from original text
        else if (i < words1.length) {
          diffResult.push({ value: words1[i], added: false, removed: true });
          i++;
        }
      }
    }
    
    return (
      <div>
        {diffResult.map((part, index) => (
          <span
            key={index}
            className={`${
              part.added
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : part.removed
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 line-through"
                : ""
            }`}
          >
            {part.value}{" "}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold">
            Compare {formatType(element.type)}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Original</h4>
              <div className="p-3 bg-muted rounded-md text-sm">{element.original}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Optimized</h4>
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-md text-sm">{element.optimized}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Diff View</h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                {highlightDifferences(element.original, element.optimized)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center"
          >
            <Check className="h-4 w-4 mr-2" /> Approve Change
          </button>
        </div>
      </div>
    </div>
  );
} 