// Trading signal interface - after API transformation
export interface TradingSignal {
  type: string; // "BUY", "SELL", "SELL_SIGNAL", etc.
  date: string; // "2020-02-25"
  price: number;
  timestamp: string; // Date string (same as date field after transformation)
  signal_type: string; // Normalized signal type: "buy", "sell", etc.
}

// Individual trade interface - after API transformation
export interface Trade {
  entry_date: string; // ISO date string "2020-02-25" (converted from Excel date)
  exit_date?: string; // ISO date string (converted from Excel date)
  pnl: number; // Profit/loss in dollars
  status: 'open' | 'closed'; // Added by API transformation
  trade_type: 'long' | 'short'; // Added by API transformation (defaults to 'long')
  // Optional fields
  price?: number;
  exit_price?: number;
  pnl_pct?: number;
}

// Performance metrics interface (extends existing)
export interface BacktestKPIs {
  sharpe_ratio: number;
  max_drawdown: number;
  total_return: number;
  win_rate: number;
  total_trades: number;
  final_value?: number;
  initial_cash?: number;
}

// Backtest result data structure
export interface BacktestResults {
  success: boolean;
  final_value?: number;
  initial_cash?: number;
  kpis: BacktestKPIs;
  signals: TradingSignal[];
  trades: Trade[];
  error?: string;
  error_type?: string;
  traceback?: string;
}

// API response from /result/{task_id}
export interface TaskResultResponse {
  data: BacktestResults;
}

// API error response
export interface TaskErrorResponse {
  error: string;
}

// Combined response type
export type TaskResponse = TaskResultResponse | TaskErrorResponse;

// Helper type guard
export function isTaskError(
  response: TaskResponse
): response is TaskErrorResponse {
  return 'error' in response;
}

export function isTaskSuccess(
  response: TaskResponse
): response is TaskResultResponse {
  return 'data' in response && !('error' in response);
}
