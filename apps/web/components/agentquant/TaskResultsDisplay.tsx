import { useState } from 'react';
import { useTaskResult } from '../../hooks/useTaskResult';
import { TradingResults } from './TradingResults';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  RefreshCw,
  AlertTriangle,
  Loader2,
  Search,
  CheckCircle,
} from 'lucide-react';

interface TaskResultsDisplayProps {
  taskId: string | null;
  title?: string;
  onClose?: () => void;
}

export function TaskResultsDisplay({
  taskId,
  title = 'Backtest Results',
  onClose,
}: TaskResultsDisplayProps) {
  const { data, isLoading, error, refetch } = useTaskResult(taskId);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">Loading Results</h3>
        <p className="text-muted-foreground">
          Fetching backtest results for task:{' '}
          <code className="bg-muted px-2 py-1 rounded text-xs">{taskId}</code>
        </p>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2 text-destructive">
          Failed to Load Results
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || String(error)}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // No task ID
  if (!taskId) {
    return (
      <Card className="p-8 text-center">
        <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Task Selected</h3>
        <p className="text-muted-foreground">
          Please provide a valid task ID to view results.
        </p>
      </Card>
    );
  }

  // No data returned
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
        <p className="text-muted-foreground mb-4">
          Results not found for task:{' '}
          <code className="bg-muted px-2 py-1 rounded text-xs">{taskId}</code>
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Again
        </Button>
      </Card>
    );
  }

  // Success state with results
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant="secondary" className="text-xs">
            Task: {taskId}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Results Display */}
      <TradingResults results={data} isVisible={true} />
    </div>
  );
}

// Demo component for testing
export function TaskResultsDemo() {
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);

  const handleViewResults = () => {
    if (currentTaskId.trim()) {
      setViewingTaskId(currentTaskId.trim());
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Task Results Viewer</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentTaskId}
            onChange={e => setCurrentTaskId(e.target.value)}
            placeholder="Enter task ID (e.g., abc123)"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <Button onClick={handleViewResults} disabled={!currentTaskId.trim()}>
            View Results
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter a valid task ID from a completed backtest to view results
        </p>
      </Card>

      {viewingTaskId && (
        <TaskResultsDisplay
          taskId={viewingTaskId}
          title={`Results for ${viewingTaskId}`}
          onClose={() => setViewingTaskId(null)}
        />
      )}
    </div>
  );
}
