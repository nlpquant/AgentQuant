import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trade, TradingSignal } from '../../types/trading';
import { Activity, Calendar, DollarSign } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TradesListProps {
  trades: Trade[];
  signals?: TradingSignal[];
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

function findSignalPrice(
  date: string,
  signals: TradingSignal[]
): number | null {
  if (!signals || !date || signals.length === 0) return null;

  // First try exact match
  const exactMatch = signals.find(s => s.date === date);
  if (exactMatch) return exactMatch.price;

  // Convert trade date to compare
  const tradeDate = new Date(date);
  const tradeDateMs = tradeDate.getTime();

  // Find the closest signal by date
  let closestSignal: TradingSignal | null = null;
  let minDifference = Infinity;

  for (const signal of signals) {
    const signalDate = new Date(signal.date);
    const signalDateMs = signalDate.getTime();
    const difference = Math.abs(tradeDateMs - signalDateMs);

    if (difference < minDifference) {
      minDifference = difference;
      closestSignal = signal;
    }
  }

  // Only return if the closest signal is within 7 days
  const maxDifferenceMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  if (closestSignal && minDifference <= maxDifferenceMs) {
    return closestSignal.price;
  }

  return null;
}

export function TradesList({
  trades,
  signals,
  isVisible = true,
}: TradesListProps) {
  const tradesRef = useRef<HTMLDivElement>(null);
  const shouldDisplay = isVisible && trades && trades.length > 0;

  useEffect(() => {
    if (shouldDisplay && tradesRef.current) {
      tradesRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [shouldDisplay]);

  if (!shouldDisplay) {
    return null;
  }

  return (
    <Card className="p-6" ref={tradesRef}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Recent Trades</h3>
        <Badge variant="secondary" className="ml-auto">
          {trades.length} total
        </Badge>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {trades.slice(0, 10).map((trade, index) => {
          const entryPrice = findSignalPrice(trade.entry_date, signals || []);
          const exitPrice = trade.exit_date
            ? findSignalPrice(trade.exit_date, signals || [])
            : null;

          return (
            <Card key={index} className="p-4 border-l-4 border-l-primary/30">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        trade.trade_type === 'long' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {trade.trade_type.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={
                        trade.status === 'closed' ? 'outline' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {trade.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex gap-4 text-sm justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Entry</span>
                      </div>
                      <div className="font-medium">
                        {formatDate(trade.entry_date)}
                      </div>
                      <div className="text-muted-foreground">
                        {entryPrice ? formatCurrency(entryPrice) : 'N/A'}
                      </div>
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
                          {exitPrice ? formatCurrency(exitPrice) : 'Open'}
                        </div>
                      </div>
                    )}

                    {trade.pnl !== undefined && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1 justify-self-end">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-muted-foreground">P&L</span>
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
                              trade.pnl_pct >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
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
              </div>
            </Card>
          );
        })}

        {trades.length > 10 && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            Showing 10 of {trades.length} trades
          </div>
        )}
      </div>
    </Card>
  );
}
