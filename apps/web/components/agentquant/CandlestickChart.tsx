import { useEffect, useRef, useState } from 'react';
import { SMA, RSI, BollingerBands } from 'technicalindicators';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isChartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    setChartReady(false);

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

    console.log('Page Render Done');

    const readyTimer = setTimeout(() => {
      setChartReady(true);
    }, 0);

    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, preview]);

  // Show loading state only when we don't have the required data
  const showLoading = !preview || isLoading || !isChartReady;

  return (
    <div style={{ position: 'relative', height: '500px' }}>
      <AnimatePresence>
        {showLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            // animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <Skeleton
              height={500}
              borderRadius="1rem"
              baseColor="#101827"
              customHighlightBackground="linear-gradient(135deg, transparent 5%, var(--base-color) 35%, #2e589e 50%, var(--base-color) 65%, transparent 95%)"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={chartContainerRef}
        style={{
          position: 'relative',
          height: '100%',
          visibility: showLoading ? 'hidden' : 'visible',
          transition: 'visibility 0s linear 0.4s', // 确保在 skeleton 消失后才可见
        }}
      >
        {!showLoading && preview && (
          <div
            className="absolute z-10 text-sm text-white font-light pointer-events-none"
            style={{ left: '12px', top: '12px' }}
          >
            {preview.ticker} {preview.time_frame?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
