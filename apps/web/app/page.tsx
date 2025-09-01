'use client';

import './index.css';

import { BackgroundPattern } from '../components/agentquant/BackgroundPattern';
import { Logo } from '../components/agentquant/Logo';
import { useState } from 'react';
import { CentralCommandBar } from '../components/agentquant/CentralCommandBar';
import { CandlestickChart } from '../components/agentquant/CandlestickChart';
import { RSIIndicator } from '../components/agentquant/RSIIndicator';
import { KPICards } from '../components/agentquant/KPICards';
import { AIAgentMonitor } from '../components/agentquant/AIAgentMonitor';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [isIteration, setIsIteration] = useState(false);

  const handleAnalyze = (query: string) => {
    setAnalysisQuery(query);
    setIsAnalyzing(true);
    setAnalysisCompleted(false);

    // Detect if this is an iteration (contains RSI or other refinements)
    const isQueryIteration =
      query.toLowerCase().includes('rsi') ||
      query.toLowerCase().includes('refinement') ||
      query.toLowerCase().includes('below 30') ||
      query.toLowerCase().includes('oversold');
    setIsIteration(isQueryIteration);

    // For demo purposes, shorter time for iterations to show speed
    const analysisTime = isQueryIteration ? 4000 : 8000;
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisCompleted(true);
    }, analysisTime);
  };

  const handleNewAnalysis = (query: string) => {
    setAnalysisCompleted(false);
    handleAnalyze(query);
  };

  const handleIterationDemo = () => {
    const refinedQuery =
      'Test 50/200 MA crossover strategy on AAPL from 2020-2024 and require the RSI to be below 30 at the time of purchase.';
    handleNewAnalysis(refinedQuery);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundPattern />

      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo />

          {/* Demo Controls - for testing the UI states */}
          <div className="flex items-center space-x-2">
            {analysisCompleted && !isIteration && (
              <button
                onClick={handleIterationDemo}
                className="px-3 py-1 text-xs bg-success hover:bg-success/90 text-success-foreground rounded-md transition-colors"
              >
                Try RSI Refinement
              </button>
            )}
            {analysisCompleted && (
              <button
                onClick={() => {
                  setAnalysisCompleted(false);
                  setIsAnalyzing(false);
                  setIsIteration(false);
                  setAnalysisQuery('');
                }}
                className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
              >
                Reset Demo
              </button>
            )}
            {isAnalyzing && (
              <button
                onClick={() => {
                  setIsAnalyzing(false);
                  setAnalysisCompleted(true);
                }}
                className="px-3 py-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
              >
                Complete Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Central Command Section */}
          <div
            className={`transition-all duration-500 ${isAnalyzing || analysisCompleted ? 'mb-8' : 'flex items-center justify-center min-h-[60vh]'}`}
          >
            <CentralCommandBar
              isAnalyzing={isAnalyzing}
              onAnalyze={analysisCompleted ? handleNewAnalysis : handleAnalyze}
              currentQuery={analysisQuery}
            />
          </div>

          {/* Data Visualization Canvas - Appears during and after analysis */}
          {(isAnalyzing || analysisCompleted) && (
            <div className="space-y-8">
              {/* Main Chart */}
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CandlestickChart
                  isLoading={isAnalyzing}
                  symbol={isIteration ? 'AAPL' : 'TSLA'}
                  showSignals={analysisCompleted}
                  isRefinedStrategy={isIteration}
                />
              </div>

              {/* RSI Indicator Panel - Only show for refined strategy */}
              {analysisCompleted && isIteration && (
                <RSIIndicator
                  isVisible={true}
                  symbol="AAPL"
                  showOversoldMarkers={true}
                />
              )}

              {/* KPI Cards - Only show when analysis is completed */}
              {analysisCompleted && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Charts column - could add more charts here */}
                  <div className="lg:col-span-2">
                    {/* Future: Additional charts like volume, etc. */}
                  </div>

                  {/* KPI Cards column */}
                  <div className="lg:col-span-1">
                    <KPICards
                      isVisible={true}
                      isRefinedStrategy={isIteration}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer tagline */}
          {!isAnalyzing && !analysisCompleted && (
            <div className="text-center mt-16 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Powered by advanced AI • Real-time market data •
                Professional-grade backtesting
              </p>
            </div>
          )}
        </div>
      </main>

      {/* AI Agent Monitor - Appears during and after analysis */}
      <AIAgentMonitor
        isVisible={isAnalyzing || analysisCompleted}
        isCompleted={analysisCompleted}
        isRefinedStrategy={isIteration}
      />
    </div>
  );
}
