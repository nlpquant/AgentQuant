import { useQuery } from '@tanstack/react-query';
import { BacktestResults } from '../types/trading';

// Define the structure we expect from the message parts
interface FunctionCompletePart {
  data?: {
    name?: string;
    payload?: {
      input?: {
        task_id?: string;
      };
    };
  };
}

// Use a more flexible approach to handle the actual message structure
interface ChatMessage {
  role: string;
  parts?: FunctionCompletePart[];
  [key: string]: unknown; // Allow additional properties
}

function extractTaskId(messages: ChatMessage[]): string | null {
  let taskId: string | null = null;
  let hasBacktestCompleted = false;

  for (const message of messages) {
    if (message.role === 'assistant' && message.parts) {
      for (const part of message.parts) {
        // First, capture the task_id from yh_query_save
        if (part.data?.name === 'Function Complete: yh_query_save') {
          taskId = part.data.payload?.input?.task_id || null;
        }
        // Then, check if code_executor (backtest) has completed
        if (part.data?.name === 'Function Complete: code_executor') {
          hasBacktestCompleted = true;
        }
      }
    }
  }

  // Only return taskId if both conditions are met
  return taskId && hasBacktestCompleted ? taskId : null;
}

async function fetchTradingResults(
  taskId: string
): Promise<BacktestResults | null> {
  const response = await fetch(`/api/result/${taskId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trading results');
  }
  const result = await response.json();

  // Ensure we return a valid result or null
  if (!result || !result.data) {
    return null;
  }

  return result.data;
}

export function useTradingResults(messages: ChatMessage[]) {
  const taskId = extractTaskId(messages);

  return useQuery({
    queryKey: ['trading-results', taskId],
    queryFn: () => fetchTradingResults(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
