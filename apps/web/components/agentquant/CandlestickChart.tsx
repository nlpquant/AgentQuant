import { useEffect, useRef } from 'react';
import { SMA, RSI, BollingerBands } from 'technicalindicators';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';

interface CandlestickChartProps {
  preview: any;
  storageKey?: string;
  isAnalyzing?: boolean;
}

const chartColors = {
  background: '#131722',
  up: '#26A69A',
  down: '#EF5350',
  grid: '#363A45',
  text: '#D1D4DC',
  crosshair: '#787B86',
};

async function fetchTickerData({
  queryKey: [_key, storageKey],
}: QueryFunctionContext): Promise<any> {
  const response = await fetch('/api/data/' + storageKey);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
}

interface IndicatorParams {
  period?: number;
  stdDev?: number;
}

interface IndicatorData {
  name: string;
  params: IndicatorParams;
}

interface CalculatedIndicator {
  data: { time: string; value: number }[];
  name: string;
}

const calculateIndicator = (
  indicatorData: IndicatorData,
  priceData: any[]
): CalculatedIndicator[] => {
  const { name, params } = indicatorData;
  const closePrices = priceData.map((item: any) => item.close);

  switch (name.toUpperCase()) {
    case 'SMA': {
      const smaValues = SMA.calculate({
        period: params.period || 20,
        values: closePrices,
      });
      const data = smaValues.map((value, index) => ({
        time: priceData[index + (params.period || 20) - 1].time,
        value,
      }));
      return [{ data, name: `SMA(${params.period || 20})` }];
    }

    case 'RSI': {
      const rsiValues = RSI.calculate({
        period: params.period || 14,
        values: closePrices,
      });
      const data = rsiValues.map((value, index) => ({
        time: priceData[index + (params.period || 14) - 1].time,
        value,
      }));
      return [{ data, name: `RSI(${params.period || 14})` }];
    }

    case 'BOLLINGERBANDS':
    case 'BB': {
      const bbData = BollingerBands.calculate({
        period: params.period || 20,
        stdDev: params.stdDev || 2,
        values: closePrices,
      });

      const period = params.period || 20;
      const stdDev = params.stdDev || 2;

      // Return all three bands
      const upperBand = bbData.map((value, index) => ({
        time: priceData[index + period - 1].time,
        value: value.upper,
      }));

      const middleBand = bbData.map((value, index) => ({
        time: priceData[index + period - 1].time,
        value: value.middle,
      }));

      const lowerBand = bbData.map((value, index) => ({
        time: priceData[index + period - 1].time,
        value: value.lower,
      }));

      return [
        { data: upperBand, name: `BB Upper(${period},${stdDev})` },
        { data: middleBand, name: `BB Middle(${period},${stdDev})` },
        { data: lowerBand, name: `BB Lower(${period},${stdDev})` },
      ];
    }

    default:
      console.warn(`Unsupported indicator: ${name}`);
      return [];
  }
};

const indicatorColors = ['#FFD700', '#1E90FF', '#32CD32', '#FF6347', '#9370DB'];

export function CandlestickChart({
  preview,
  storageKey,
}: CandlestickChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ticker', storageKey],
    queryFn: fetchTickerData,
    enabled: !!storageKey,
  });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current?.clientWidth,
      height: 500,
      layout: {
        background: { color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: {
          color: chartColors.grid,
        },
        horzLines: {
          color: chartColors.grid,
        },
      },
      crosshair: {
        vertLine: { color: chartColors.crosshair },
        horzLine: { color: chartColors.crosshair },
      },
      timeScale: {
        borderColor: chartColors.grid,
      },
    });

    // chart.timeScale().fitContent();

    const newSeries = chart.addSeries(CandlestickSeries);
    newSeries.setData(data.data);

    let seriesColorIndex = 0;
    preview.indicators?.forEach((indicator: IndicatorData) => {
      const calculatedSeries = calculateIndicator(indicator, data.data);
      calculatedSeries.forEach(calculatedData => {
        if (calculatedData.data.length > 0) {
          // Special styling for Bollinger Bands
          const isBollingerBands =
            indicator.name.toUpperCase().includes('BB') ||
            indicator.name.toUpperCase().includes('BOLLINGERBANDS');

          let lineWidth: 1 | 2 | 3 | 4 = 2;
          let lineStyle: 0 | 1 | 2 | 3 = 0; // Solid line

          if (isBollingerBands) {
            if (
              calculatedData.name.includes('Upper') ||
              calculatedData.name.includes('Lower')
            ) {
              lineWidth = 1;
              lineStyle = 2; // Dashed line
            }
          }

          const series = chart.addSeries(LineSeries, {
            color: indicatorColors[seriesColorIndex % indicatorColors.length],
            lineWidth,
            lineStyle,
          });
          series.setData(calculatedData.data);
          seriesColorIndex++;
        }
      });
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, preview?.ticker, preview?.time_frame, preview?.indicators]);

  // Show loading state only when we don't have the required data
  const showLoading = !data || !preview || isLoading;

  if (showLoading) {
    return (
      <div
        className="flex items-center justify-center bg-card border border-border rounded-xl"
        style={{ height: '500px' }}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Animated chart icon */}
          <div className="relative">
            <div className="w-12 h-12 border-2 border-primary/20 rounded-lg bg-primary/5 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            {/* Animated dots */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              <div
                className="w-1 h-1 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-1 h-1 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-1 h-1 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <p className="text-foreground font-medium">Loading Chart Data</p>
            <p className="text-muted-foreground text-sm">
              {!storageKey ? 'Waiting for data...' : 'Fetching market data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={chartContainerRef} style={{ position: 'relative' }}>
        {/* React-rendered legend */}
        <div
          className="absolute z-10 text-sm text-white font-light pointer-events-none"
          style={{
            left: '12px',
            top: '12px',
            fontFamily: 'sans-serif',
            lineHeight: '18px',
            fontWeight: 300,
          }}
        >
          {preview?.ticker} {preview?.time_frame?.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
