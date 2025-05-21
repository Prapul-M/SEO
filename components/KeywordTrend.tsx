import { useState } from "react";
import { ArrowRight, ArrowUp, Plus, TrendingUp } from "lucide-react";

interface Keyword {
  keyword: string;
  volume: number;
  growth: number;
  difficulty: number;
}

interface KeywordTrendProps {
  keywords: Keyword[];
  onAddKeyword: (keyword: string) => void;
}

export default function KeywordTrend({ keywords, onAddKeyword }: KeywordTrendProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const filteredKeywords = keywords.filter(keyword => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "high-growth" && keyword.growth > 20) return true;
    if (selectedCategory === "low-difficulty" && keyword.difficulty < 30) return true;
    if (selectedCategory === "high-volume" && keyword.volume > 1000) return true;
    return false;
  });
  
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return "text-green-500";
    if (difficulty < 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getGrowthColor = (growth: number) => {
    if (growth > 20) return "text-green-500";
    if (growth > 0) return "text-yellow-500";
    return "text-red-500";
  };
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            Trending Keywords
          </h3>
          <div className="text-xs text-muted-foreground">
            Updated {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex space-x-2 pb-1 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 text-xs rounded-full ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory("high-growth")}
            className={`px-3 py-1 text-xs rounded-full ${
              selectedCategory === "high-growth"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            High Growth
          </button>
          <button
            onClick={() => setSelectedCategory("low-difficulty")}
            className={`px-3 py-1 text-xs rounded-full ${
              selectedCategory === "low-difficulty"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Easy to Rank
          </button>
          <button
            onClick={() => setSelectedCategory("high-volume")}
            className={`px-3 py-1 text-xs rounded-full ${
              selectedCategory === "high-volume"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            High Volume
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-border">
        {filteredKeywords.length > 0 ? (
          filteredKeywords.map((keyword, index) => (
            <div key={index} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">{keyword.keyword}</div>
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span>Volume: {keyword.volume.toLocaleString()}</span>
                  <span className={`flex items-center ${getGrowthColor(keyword.growth)}`}>
                    <ArrowUp className="h-3 w-3 mr-0.5" />
                    {keyword.growth}%
                  </span>
                  <span className={getDifficultyColor(keyword.difficulty)}>
                    KD: {keyword.difficulty}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onAddKeyword(keyword.keyword)}
                className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No keywords matching the selected filter.
          </div>
        )}
      </div>
      
      <div className="p-3 bg-muted/40 border-t border-border">
        <button className="w-full py-2 text-sm text-primary hover:text-primary/90 transition-colors flex items-center justify-center">
          View all keywords <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
} 