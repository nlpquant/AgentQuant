import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { KPICards } from './KPICards';
import { BacktestResults, Trade, TradingSignal } from '../../types/trading';
import {
  TrendingUp,
  Activity,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface TradingResultsProps {
  results: BacktestResults;
  isVisible?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TradesTable({ trades }: { trades: Trade[] }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No trades executed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.slice(0, 10).map((trade, index) => (
        <Card key={index} className="p-4 border-l-4 border-l-primary/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={trade.trade_type === 'long' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {trade.trade_type.toUpperCase()}
              </Badge>
              <Badge
                variant={trade.status === 'closed' ? 'outline' : 'secondary'}
                className="text-xs"
              >
                {trade.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  <span>Entry</span>
                </div>
                <div className="font-medium">
                  {formatDate(trade.entry_date)}
                </div>
                <div className="text-muted-foreground">
                  {trade.entry_price
                    ? formatCurrency(trade.entry_price)
                    : 'N/A'}
                </div>

                {trade.exit_date && (
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Exit</span>
                    </div>
                    <div className="font-medium">
                      {formatDate(trade.exit_date)}
                    </div>
                    <div className="text-muted-foreground">
                      {trade.exit_price
                        ? formatCurrency(trade.exit_price)
                        : 'Open'}
                    </div>
                  </div>
                )}
              </div>

              {trade.pnl !== undefined && (
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">P&L</span>
                  </div>
                  <div
                    className={`font-semibold ${
                      trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trade.pnl >= 0 ? '+' : ''}
                    {formatCurrency(trade.pnl)}
                  </div>
                  {trade.pnl_pct !== undefined && (
                    <div
                      className={`text-xs ${
                        trade.pnl_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ({trade.pnl_pct >= 0 ? '+' : ''}
                      {trade.pnl_pct.toFixed(2)}%)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {trades.length > 10 && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          Showing 10 of {trades.length} trades
        </div>
      )}
    </div>
  );
}

function SignalsSection({ signals }: { signals: TradingSignal[] }) {
  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No signals generated</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals
        .slice(-20)
        .reverse()
        .map((signal, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  signal.signal_type === 'buy' || signal.type === 'BUY'
                    ? 'bg-green-500'
                    : signal.signal_type === 'sell' || signal.type === 'SELL'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                }`}
              />
              <div>
                <div className="font-medium text-sm">
                  {(signal.signal_type || signal.type).toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(signal.date)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-medium text-sm">
                {formatCurrency(signal.price)}
              </div>
            </div>
          </div>
        ))}

      {signals.length > 20 && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          Showing latest 20 of {signals.length} signals
        </div>
      )}
    </div>
  );
}

export function TradingResults({
  results,
  isVisible = true,
}: TradingResultsProps) {
  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPICards isVisible={true} performanceMetrics={results.kpis} />

      {/* Trades and Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Trades</h3>
            <Badge variant="secondary" className="ml-auto">
              {results.trades?.length || 0} total
            </Badge>
          </div>
          <TradesTable trades={results.trades || []} />
        </Card>

        {/* Trading Signals */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Trading Signals</h3>
            <Badge variant="secondary" className="ml-auto">
              {results.signals?.length || 0} total
            </Badge>
          </div>
          <SignalsSection signals={results.signals || []} />
        </Card>
      </div>

      {/* Strategy Summary */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Backtest Summary
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Initial Capital:{' '}
                <span className="font-medium">
                  {formatCurrency(results.initial_cash || 100000)}
                </span>
              </p>
              <p>
                Final Value:{' '}
                <span className="font-medium">
                  {formatCurrency(results.final_value || 0)}
                </span>
              </p>
              <p>
                Total Return:{' '}
                <span
                  className={`font-medium ${
                    results.kpis.total_return >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {results.kpis.total_return >= 0 ? '+' : ''}
                  {results.kpis.total_return.toFixed(2)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
