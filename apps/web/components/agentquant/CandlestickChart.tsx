import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from 'recharts';

// Mock data for Tesla (TSLA) - realistic price movements
const generateMockData = () => {
  const data = [];
  let basePrice = 180;
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate realistic price movements
    const volatility = 0.03;
    const trend = Math.sin(i / 20) * 0.002;
    const randomChange = (Math.random() - 0.5) * volatility;

    basePrice = basePrice * (1 + trend + randomChange);

    const open = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    const close = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);

    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000 + 5000000),
    });
  }

  return data;
};

// Calculate moving averages
const calculateMovingAverages = (data: any[], periods: number[]) => {
  return data.map((item, index) => {
    const result = { ...item };

    periods.forEach(period => {
      if (index >= period - 1) {
        const sum = data
          .slice(index - period + 1, index + 1)
          .reduce((acc, curr) => acc + curr.close, 0);
        result[`ma${period}`] = Number((sum / period).toFixed(2));
      }
    });

    return result;
  });
};

interface CandlestickChartProps {
  isLoading?: boolean;
  symbol?: string;
  showSignals?: boolean;
  isRefinedStrategy?: boolean;
}

export function CandlestickChart({
  isLoading = false,
  symbol = 'TSLA',
  showSignals = false,
  isRefinedStrategy = false,
}: CandlestickChartProps) {
  const chartData = useMemo(() => {
    const rawData = generateMockData();
    const dataWithMA = calculateMovingAverages(rawData, [10, 30]);

    // Add trading signals for Golden Cross strategy
    if (showSignals) {
      return dataWithMA.map((item, index) => {
        const result = { ...item };

        // Golden Cross: Buy when MA10 crosses above MA30
        // Death Cross: Sell when MA10 crosses below MA30
        if (index > 0 && item.ma10 && item.ma30) {
          const prevItem = dataWithMA[index - 1];

          if (prevItem.ma10 && prevItem.ma30) {
            // Buy signal: MA10 crosses above MA30
            if (prevItem.ma10 <= prevItem.ma30 && item.ma10 > item.ma30) {
              // For refined strategy, add RSI filter - only show some signals
              if (isRefinedStrategy) {
                // Simulate RSI < 30 condition - show fewer signals (about 60% less)
                if (index % 3 === 0) {
                  // Only show every 3rd signal to simulate RSI filter
                  result.buySignal = item.close;
                }
              } else {
                result.buySignal = item.close;
              }
            }
            // Sell signal: MA10 crosses below MA30
            else if (prevItem.ma10 >= prevItem.ma30 && item.ma10 < item.ma30) {
              // For refined strategy, match reduced buy signals with sell signals
              if (isRefinedStrategy) {
                if (index % 3 === 0) {
                  result.sellSignal = item.close;
                }
              } else {
                result.sellSignal = item.close;
              }
            }
          }
        }

        return result;
      });
    }

    return dataWithMA;
  }, [showSignals, isRefinedStrategy]);

  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, close, high, low } = payload;
    const isRising = close > open;
    const color = isRising ? '#10B981' : '#EF4444';

    const candleWidth = Math.max(width * 0.6, 2);
    const wickX = x + width / 2;
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);
    const bodyHeight = Math.abs(close - open);

    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={high}
          x2={wickX}
          y2={low}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + (width - candleWidth) / 2}
          y={bodyTop}
          width={candleWidth}
          height={Math.max(bodyHeight, 1)}
          fill={isRising ? color : 'transparent'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  const BuySignal = (props: any) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;

    return (
      <polygon
        points={`${cx},${cy - 8} ${cx - 6},${cy + 4} ${cx + 6},${cy + 4}`}
        fill="#10B981"
        stroke="#10B981"
        strokeWidth={1}
      />
    );
  };

  const SellSignal = (props: any) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;

    return (
      <polygon
        points={`${cx},${cy + 8} ${cx - 6},${cy - 4} ${cx + 6},${cy - 4}`}
        fill="#EF4444"
        stroke="#EF4444"
        strokeWidth={1}
      />
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {symbol} • Daily Chart
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRefinedStrategy
              ? 'Historical price data with MA crossover + RSI oversold filter'
              : 'Historical price data with 10-day & 30-day moving averages'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span className="text-xs text-muted-foreground">MA10</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-chart-4"></div>
            <span className="text-xs text-muted-foreground">MA30</span>
          </div>
          {showSignals && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent border-b-success"></div>
                <span className="text-xs text-muted-foreground">Buy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-0 h-0 border-l-2 border-r-2 border-t-3 border-transparent border-t-danger"></div>
                <span className="text-xs text-muted-foreground">Sell</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />

            {/* Moving Averages */}
            <Line
              type="monotone"
              dataKey="ma10"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="ma30"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#E5E7EB"
              strokeWidth={1}
              dot={false}
              opacity={0.6}
            />

            {/* Trading Signals */}
            {showSignals && (
              <>
                <Scatter
                  dataKey="buySignal"
                  fill="#10B981"
                  shape={<BuySignal />}
                />
                <Scatter
                  dataKey="sellSignal"
                  fill="#EF4444"
                  shape={<SellSignal />}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">
                Loading full analysis...
              </p>
            </div>
          </div>
        )}

        {/* Analysis Progress Bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full animate-pulse"
                style={{
                  width: '35%',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
