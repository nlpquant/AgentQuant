from datetime import datetime
import pandas as pd
import yfinance as yf

from mcp_server.models import OHLCVData


interval_timeframe_map = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1wk",
    "1M": "1mo",
}


def query_ticker_historical_data(
    ticker, start_date, end_date, time_frame
) -> pd.DataFrame:
    interval = interval_timeframe_map.get(time_frame, "1d")
    tickerApi = yf.Ticker(ticker=ticker)
    try:
        data = tickerApi.history(
            start=start_date, end=end_date, interval=interval, progress=False
        )
    except TypeError:
        # Fallback for older yfinance versions that don't support progress parameter
        data = tickerApi.history(start=start_date, end=end_date, interval=interval)
    return data


def yfinance_to_ohlcv(data: pd.DataFrame) -> list:
    ohlcv_data = []
    for index, row in data.iterrows():
        try:
            # Handle both DatetimeIndex and regular index
            if hasattr(index, "strftime"):
                date_str = index.strftime("%Y-%m-%d")
                timestamp = int(index.timestamp() * 1000)
            else:
                date_str = str(index)[:10]
                try:
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                    timestamp = int(dt.timestamp() * 1000)
                except ValueError:
                    timestamp = 0
            ohlcv_data.append(
                OHLCVData(
                    date=date_str,
                    timestamp=timestamp,
                    open=round(float(row["Open"]), 4),
                    high=round(float(row["High"]), 4),
                    low=round(float(row["Low"]), 4),
                    close=round(float(row["Close"]), 4),
                    volume=(int(row["Volume"]) if not pd.isna(row["Volume"]) else 0),
                )
            )
        except (ValueError, KeyError, TypeError) as e:
            continue
    return ohlcv_data


def redis_to_ohlcv(data: list) -> list:
    """Convert raw data to OHLCV format."""
    ohlcv_data = []
    for data_point in data:
        timestamp = data_point[0]
        dt = datetime.fromtimestamp(timestamp / 1000)
        date_str = dt.strftime("%Y-%m-%d")
        ohlcv_data.append(
            OHLCVData(
                date=date_str,
                timestamp=int(timestamp),
                open=data_point[1],
                high=data_point[2],
                low=data_point[3],
                close=data_point[4],
                volume=int(data_point[5]),
            )
        )
    return ohlcv_data


def ohlcv_to_redis(ohlcv_data: list) -> list:
    """Convert OHLCV data to a format suitable for Redis storage."""
    redis_data = []
    for ohlcv in ohlcv_data:
        redis_data.append(
            [
                ohlcv.timestamp,
                ohlcv.open,
                ohlcv.high,
                ohlcv.low,
                ohlcv.close,
                ohlcv.volume,
            ]
        )
    return redis_data
