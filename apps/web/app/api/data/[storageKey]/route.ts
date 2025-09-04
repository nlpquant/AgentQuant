import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ storageKey: string }> }
) {
  const { storageKey } = await params;

  console.log('storageKey:', storageKey);

  try {
    const response = await fetch(`http://localhost:8080/data/${storageKey}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const newData = data.data.map((item: { timestamp: number }) => ({
      ...item,
      time: item.timestamp / 1000,
    }));

    return NextResponse.json(
      { data: newData },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
