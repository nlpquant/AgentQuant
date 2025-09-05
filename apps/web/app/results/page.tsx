'use client';

import { TaskResultsDemo } from '../../components/agentquant/TaskResultsDisplay';

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light mb-2">Trading Results Viewer</h1>
          <p className="text-muted-foreground">
            View backtest results and trading performance metrics
          </p>
        </div>

        <TaskResultsDemo />
      </div>
    </div>
  );
}
