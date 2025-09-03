'use client';

import './index.css';

import { BackgroundPattern } from '../components/agentquant/BackgroundPattern';
import { Logo } from '../components/agentquant/Logo';
import { CentralCommandBar } from '../components/agentquant/CentralCommandBar';
import { CandlestickChart } from '../components/agentquant/CandlestickChart';
import { KPICards } from '../components/agentquant/KPICards';
import { useChat } from '@ai-sdk/react';

// Helper to extract function data from all assistant messages
const extractFunctionData = (messages: any[], functionName: string) => {
  for (const message of messages) {
    if (message.role === 'assistant') {
      const part = message?.parts?.find(
        (part: any) => part.data?.name === `Function Complete: ${functionName}`
      );
      if (part) {
        return part.data?.payload?.output;
      }
    }
  }
  return null;
};

export default function Home() {
  const { sendMessage, messages, status, setMessages } = useChat();

  // Extract data from all assistant messages
  const preview = extractFunctionData(messages, 'quick_preview');
  const storageData = extractFunctionData(messages, 'yh_query_save');
  const storageKey = storageData?.storage_key;

  // Derive UI state from messages
  const isAnalyzing = status === 'submitted' || status === 'streaming';
  const isAnalysisCompleted = !!preview && !isAnalyzing;

  const handleAnalyze = async (query: string) => {
    setMessages([]);
    await sendMessage({ text: query });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundPattern />

      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Central Command Section */}
          <div
            className={`transition-all duration-500 ${
              isAnalyzing || isAnalysisCompleted
                ? 'mb-8'
                : 'flex items-center justify-center min-h-[60vh]'
            }`}
          >
            <CentralCommandBar
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
            />
          </div>

          {/* Data Visualization Canvas - Appears during and after analysis */}
          {(isAnalyzing || preview) && (
            <div className="space-y-8">
              {/* Main Chart */}
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CandlestickChart
                  preview={preview}
                  storageKey={storageKey}
                  isAnalyzing={isAnalyzing}
                />
              </div>

              {/* KPI Cards - Only show when analysis is completed */}
              {isAnalysisCompleted && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Charts column - could add more charts here */}
                  <div className="lg:col-span-2">
                    {/* Future: Additional charts like volume, etc. */}
                  </div>

                  {/* KPI Cards column */}
                  <div className="lg:col-span-1">
                    <KPICards isVisible={true} isRefinedStrategy={false} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer tagline */}
          {!isAnalyzing && !isAnalysisCompleted && (
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
