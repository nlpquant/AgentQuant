import { NextRequest, NextResponse } from 'next/server';

// Utility function to convert Matplotlib/backtrader date to ISO date string
function matplotlibDateToISO(mplDate: number): string {
  // Matplotlib's epoch is 0001-01-01, while JS epoch is 1970-01-01
  // 1970-01-01 is day 719163 in Matplotlib
  const MplEpochOffsetDays = 719163;

  // Calculate days since JS epoch (1970-01-01)
  const daysSinceJsEpoch = mplDate - MplEpochOffsetDays;

  // Convert days to milliseconds (1 day = 24 * 60 * 60 * 1000 ms)
  const msSinceJsEpoch = daysSinceJsEpoch * 86400000;

  // Create JavaScript Date object
  const jsDate = new Date(msSinceJsEpoch);

  return jsDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// Transform the raw backend data to frontend-friendly format
function transformBackendData(rawData: any) {
  if (!rawData?.data) return rawData;

  const transformedData = { ...rawData };

  // Transform trades - convert Matplotlib/backtrader dates to ISO strings
  if (
    transformedData.data.trades &&
    Array.isArray(transformedData.data.trades)
  ) {
    transformedData.data.trades = transformedData.data.trades.map(
      (trade: any) => ({
        ...trade,
        entry_date:
          typeof trade.entry_date === 'number'
            ? matplotlibDateToISO(trade.entry_date)
            : trade.entry_date,
        exit_date:
          typeof trade.exit_date === 'number'
            ? matplotlibDateToISO(trade.exit_date)
            : trade.exit_date,
        // Determine trade status
        status: trade.exit_date ? 'closed' : 'open',
        // Assume all trades are long positions unless specified
        trade_type: trade.trade_type || 'long',
      })
    );
  }

  // Transform signals - standardize the signal_type field
  if (
    transformedData.data.signals &&
    Array.isArray(transformedData.data.signals)
  ) {
    transformedData.data.signals = transformedData.data.signals.map(
      (signal: any) => ({
        ...signal,
        // Normalize signal types and add signal_type for backward compatibility
        signal_type:
          signal.type?.toLowerCase().replace('_signal', '') || 'unknown',
        // Keep the original date string format for signals
        timestamp: signal.date,
      })
    );
  }

  return transformedData;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  console.log('Fetching result for taskId:', taskId);

  try {
    const mcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:8080';
    const response = await fetch(`${mcpUrl}/result/${taskId}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch result from backend' },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    // Transform the data before sending to frontend
    const transformedData = transformBackendData(rawData);

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
