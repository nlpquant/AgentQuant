import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CentralCommandBarProps {
  isAnalyzing?: boolean;
  onAnalyze?: (query: string) => void;
  currentQuery?: string;
}

export function CentralCommandBar({
  isAnalyzing = false,
  onAnalyze,
  currentQuery,
}: CentralCommandBarProps) {
  const [query, setQuery] = useState('');

  // Update query when currentQuery changes (for showing refined queries)
  useEffect(() => {
    if (currentQuery && currentQuery !== query) {
      setQuery(currentQuery);
    }
  }, [currentQuery, query]);

  const handleAnalyze = async () => {
    if (!query.trim() || isAnalyzing) return;

    if (onAnalyze) {
      onAnalyze(query);
    }
  };

  const placeholderText = `Describe your trading strategy... 

e.g., Backtest a Golden Cross strategy for TSLA using 10-day and 30-day moving averages.`;

  return (
    <div className="w-full space-y-6">
      {/* Command Bar Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wider">
            AI Trading Agent
          </span>
        </div>
        <h1 className="text-4xl font-semibold text-foreground">
          The Flight Simulator for Trading Strategies
        </h1>
        <p className="text-lg text-muted-foreground">
          Describe your strategy and let our AI agent analyze, backtest, and
          optimize it for you.
        </p>
      </div>

      {/* Command Input Area */}
      <div className={`relative ${isAnalyzing ? 'opacity-75' : ''}`}>
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <Textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholderText}
            disabled={isAnalyzing}
            className="min-h-[120px] text-lg font-mono tracking-wide bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>✨ AI-powered analysis</span>
              <span>📊 Real market data</span>
              <span>⚡ Instant results</span>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!query.trim() || isAnalyzing}
              className="px-8 py-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Analyzing...
                </>
              ) : (
                <>
                  Launch AI Agent Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl -z-10" />

        {/* Analysis overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-card/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analysis in progress...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Examples - Hidden during analysis */}
      {!isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              title: 'RSI Mean Reversion',
              description: 'Buy when RSI < 30, sell when RSI > 70',
              example:
                'Backtest RSI mean reversion strategy on SPY with 14-period RSI',
            },
            {
              title: 'Moving Average Crossover',
              description: 'Golden cross and death cross signals',
              example:
                'Test 10/20 MA crossover strategy on AAPL from 2020-2024',
            },
            {
              title: 'Bollinger Band Breakout',
              description: 'Trade breakouts from Bollinger Bands',
              example:
                'Analyze BB breakout strategy on NVDA with 2-day holding period',
            },
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example.example)}
              className="text-left p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-200 group"
            >
              <h4 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                {example.title}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {example.description}
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                &#34;{example.example}&#34;
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
