import { useEffect, useRef } from 'react';
import { SMA } from 'technicalindicators';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';

interface CandlestickChartProps {
  preview: any;
  storageKey?: string;
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

const indicators = {
  SMA: SMA,
};

const indicatorColors = ['yellow', 'blue'];

export function CandlestickChart({
  preview,
  storageKey,
}: CandlestickChartProps) {
  const { data } = useQuery({
    queryKey: ['ticker', storageKey],
    queryFn: fetchTickerData,
    enabled: !!storageKey,
  });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current!!, {
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

    preview.indicators.forEach((indicator, indicatorIndex) => {
      const calculated = indicators[indicator.name]
        .calculate({
          period: indicator.params.period,
          values: data.data.map((item: any) => item.close),
        })
        .map((item, index: any) => ({
          time: data.data[index + indicator.params.period - 1].time,
          value: item,
        }));
      const series = chart.addSeries(LineSeries, {
        color: indicatorColors[indicatorIndex],
        lineWidth: 1,
      });
      series.setData(calculated);
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, preview.ticker, preview.time_frame, preview.indicators]);

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
