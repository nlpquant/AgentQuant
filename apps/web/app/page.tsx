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
import { useChat, useCompletion } from '@ai-sdk/react';

interface AnalysisState {
  isAnalyzing: boolean;
  analysisCompleted: boolean;
  analysisQuery: string;
  isIteration: boolean;
}

export default function Home() {
  const { sendMessage, messages } = useChat();

  const stepMessage = messages.find(message => message.role === 'assistant');

  const preview = stepMessage?.parts.find(
    part => part.data.name === 'Function Complete: quick_preview'
  )?.data.payload?.output;

  const storageKey = stepMessage?.parts.find(
    part => part.data.name === 'Function Complete: yh_query_save'
  )?.data.payload?.output.storage_key;

  // const isLoading = status === 'submitted' || status === 'streaming';

  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    analysisCompleted: false,
    analysisQuery: '',
    isIteration: false,
  });

  const handleAnalyze = async (query: string) => {
    const isQueryIteration =
      query.toLowerCase().includes('rsi') ||
      query.toLowerCase().includes('refinement') ||
      query.toLowerCase().includes('below 30') ||
      query.toLowerCase().includes('oversold');

    setState({
      analysisQuery: query,
      isAnalyzing: true,
      analysisCompleted: false,
      isIteration: isQueryIteration,
    });

    // const analysisTime = isQueryIteration ? 2000 : 3000;
    // setTimeout(() => {
    //   setState(prev => ({
    //     ...prev,
    //     isAnalyzing: false,
    //     analysisCompleted: true,
    //   }));
    // }, analysisTime);
    await sendMessage({ text: query });
  };

  const handleNewAnalysis = (query: string) => {
    setState(prev => ({ ...prev, analysisCompleted: false }));
    handleAnalyze(query);
  };

  const handleIterationDemo = () => {
    const refinedQuery =
      'Test 50/200 MA crossover strategy on AAPL from 2020-2024 and require the RSI to be below 30 at the time of purchase.';
    handleNewAnalysis(refinedQuery);
  };

  const resetDemo = () => {
    setState({
      isAnalyzing: false,
      analysisCompleted: false,
      analysisQuery: '',
      isIteration: false,
    });
  };

  const completeAnalysis = () => {
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      analysisCompleted: true,
    }));
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
            {state.analysisCompleted && !state.isIteration && (
              <button
                onClick={handleIterationDemo}
                className="px-3 py-1 text-xs bg-success hover:bg-success/90 text-success-foreground rounded-md transition-colors"
              >
                Try RSI Refinement
              </button>
            )}
            {state.analysisCompleted && (
              <button
                onClick={resetDemo}
                className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
              >
                Reset Demo
              </button>
            )}
            {state.isAnalyzing && (
              <button
                onClick={completeAnalysis}
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
            className={`transition-all duration-500 ${
              state.isAnalyzing || state.analysisCompleted
                ? 'mb-8'
                : 'flex items-center justify-center min-h-[60vh]'
            }`}
          >
            <CentralCommandBar
              isAnalyzing={state.isAnalyzing}
              onAnalyze={
                state.analysisCompleted ? handleNewAnalysis : handleAnalyze
              }
              currentQuery={state.analysisQuery}
            />
          </div>

          {/* Data Visualization Canvas - Appears during and after analysis */}
          {preview && (
            <div className="space-y-8">
              {/* Main Chart */}
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CandlestickChart
                  isLoading={state.isAnalyzing}
                  preview={preview}
                  symbol={state.isIteration ? 'AAPL' : 'TSLA'}
                  showSignals={state.analysisCompleted}
                  isRefinedStrategy={state.isIteration}
                  storageKey={storageKey}
                />
              </div>

              {/* RSI Indicator Panel - Only show for refined strategy */}
              {state.analysisCompleted && state.isIteration && (
                <RSIIndicator
                  isVisible={true}
                  symbol="AAPL"
                  showOversoldMarkers={true}
                />
              )}

              {/* KPI Cards - Only show when analysis is completed */}
              {state.analysisCompleted && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Charts column - could add more charts here */}
                  <div className="lg:col-span-2">
                    {/* Future: Additional charts like volume, etc. */}
                  </div>

                  {/* KPI Cards column */}
                  <div className="lg:col-span-1">
                    <KPICards
                      isVisible={true}
                      isRefinedStrategy={state.isIteration}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer tagline */}
          {!state.isAnalyzing && !state.analysisCompleted && (
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
      {/*<AIAgentMonitor*/}
      {/*  isVisible={state.isAnalyzing || state.analysisCompleted}*/}
      {/*  isCompleted={state.analysisCompleted}*/}
      {/*  isRefinedStrategy={state.isIteration}*/}
      {/*/>*/}
    </div>
  );
}
