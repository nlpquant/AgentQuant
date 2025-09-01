import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

// Generate RSI data that aligns with the main chart
const generateRSIData = () => {
  const data = [];
  const startDate = new Date('2024-01-01');
  let rsi = 50; // Start at neutral

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate realistic RSI oscillation between 0-100
    const volatility = 0.15;
    const meanReversion = (50 - rsi) * 0.05; // Pull towards 50
    const randomChange = (Math.random() - 0.5) * volatility * 20;

    rsi = Math.max(0, Math.min(100, rsi + meanReversion + randomChange));

    // Add some periods where RSI goes below 30 (oversold) or above 70 (overbought)
    if (i % 25 === 0) {
      rsi =
        Math.random() < 0.5 ? 25 + Math.random() * 10 : 75 + Math.random() * 15;
    }

    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: date.toISOString().split('T')[0],
      rsi: Number(rsi.toFixed(1)),
      oversold: rsi < 30,
      overbought: rsi > 70,
    });
  }

  return data;
};

interface RSIIndicatorProps {
  isVisible?: boolean;
  symbol?: string;
  showOversoldMarkers?: boolean;
}

export function RSIIndicator({
  isVisible = true,
  symbol = 'TSLA',
  showOversoldMarkers = false,
}: RSIIndicatorProps) {
  const rsiData = useMemo(() => generateRSIData(), []);

  if (!isVisible) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-in slide-in-from-bottom-4 duration-500 delay-200">
      {/* RSI Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            RSI (14) • Relative Strength Index
          </h4>
          <p className="text-sm text-muted-foreground">
            Momentum oscillator for {symbol} • Oversold &lt; 30 • Overbought
            &gt; 70
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-danger opacity-30"></div>
            <span className="text-muted-foreground">Oversold (&lt;30)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-success opacity-30"></div>
            <span className="text-muted-foreground">Overbought (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* RSI Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rsiData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 20, 30, 50, 70, 80, 100]}
            />

            {/* Oversold/Overbought zones */}
            <defs>
              <linearGradient id="oversoldZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="overboughtZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            {/* Reference lines */}
            <ReferenceLine
              y={30}
              stroke="#EF4444"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <ReferenceLine
              y={50}
              stroke="#9CA3AF"
              strokeDasharray="1 1"
              strokeWidth={1}
              opacity={0.5}
            />
            <ReferenceLine
              y={70}
              stroke="#10B981"
              strokeDasharray="2 2"
              strokeWidth={1}
            />

            {/* RSI Line */}
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />

            {/* Oversold markers for refined strategy */}
            {showOversoldMarkers &&
              rsiData.map((point, index) => {
                if (point.oversold) {
                  return (
                    <circle
                      key={`oversold-${index}`}
                      cx={`${(index / (rsiData.length - 1)) * 100}%`}
                      cy={`${100 - point.rsi}%`}
                      r="3"
                      fill="#EF4444"
                      opacity={0.8}
                    />
                  );
                }
                return null;
              })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-4 gap-4 flex-1">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current</div>
            <div className="font-medium text-foreground">
              {rsiData[rsiData.length - 1]?.rsi || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Oversold</div>
            <div className="font-medium text-danger">
              {rsiData.filter(d => d.oversold).length} days
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Overbought</div>
            <div className="font-medium text-success">
              {rsiData.filter(d => d.overbought).length} days
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Avg RSI</div>
            <div className="font-medium text-foreground">
              {(
                rsiData.reduce((sum, d) => sum + d.rsi, 0) / rsiData.length
              ).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
