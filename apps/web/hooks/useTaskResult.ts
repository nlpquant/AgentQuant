import { useQuery } from '@tanstack/react-query';
import {
  TaskResponse,
  BacktestResults,
  isTaskError,
  isTaskSuccess,
} from '../types/trading';

async function fetchTaskResult(taskId: string): Promise<BacktestResults> {
  const response = await fetch(`/api/result/${taskId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: TaskResponse = await response.json();

  if (isTaskError(result)) {
    throw new Error(result.error);
  }

  if (isTaskSuccess(result) && result.data.success) {
    return result.data;
  }

  throw new Error(result.data?.error || 'Backtest execution failed');
}

export function useTaskResult(taskId: string | null) {
  return useQuery({
    queryKey: ['taskResult', taskId],
    queryFn: () => fetchTaskResult(taskId!),
    enabled: !!taskId?.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
