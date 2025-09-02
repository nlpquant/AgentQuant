from datetime import datetime
import json
import uuid
from fastapi import FastAPI
import pandas as pd
from mcp_server.logging import AppLogger
from mcp_server.redis import init_redis_pool
from mcp_server.sse import create_sse_server
from mcp.server.fastmcp import FastMCP
from mcp_server.models import OHLCVData, TaskEntry
from mcp_server.config import settings as global_settings
import yfinance as yf

logger = AppLogger().get_logger()
api = FastAPI()
mcp = FastMCP("Server")


@api.on_event("startup")
async def startup_event():
    logger.info("Opening redis connection pool...")
    api.state.redis = await init_redis_pool()


@api.on_event("shutdown")
async def shutdown_event():
    logger.info("Closing redis connection pool...")
    await api.state.redis.close()


@mcp.tool()
async def task_register(user_prompt: str) -> dict:
    """Register a task with the user_prompt, return a task UUID if succeeded."""
    try:
        uid = str(uuid.uuid4())
        logger.info(f"Registered task {uid} with prompt: {user_prompt}")
        entry = TaskEntry(user_prompt=user_prompt)
        await api.state.redis.set(
            uid, json.dumps(entry.to_dict()), ex=global_settings.task_expire
        )
    except Exception as e:
        logger.error(f"Failed to save to Redis: {e}")
        return {"task_id": uid, "status": "failed"}
    return {"task_id": uid, "status": "success"}


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


@mcp.tool()
async def yh_query_save(
    task_id: str, ticker: str, time_frame: str, start_date: str, end_date: str
) -> dict:
    """Query Yahoo Finance and save the data, return storage key if succeeded."""

    try:
        ohlcv_data = []
        stroage_key = f"{ticker}:{time_frame}:{start_date}:{end_date}"
        cached_data = await api.state.redis.get(stroage_key)
        if cached_data:
            logger.info(f"Data for {stroage_key} already exists in Redis.")
            for data_point in list(json.loads(cached_data)):
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
            task_info = await api.state.redis.get(task_id)
            if task_info:
                task_entry = TaskEntry(**json.loads(task_info))
                task_entry.storage_key = stroage_key
                await api.state.redis.set(
                    task_id,
                    json.dumps(task_entry.to_dict()),
                    ex=global_settings.task_expire,
                )
            logger.info(f"Task info for {task_id} updated in Redis.")
            return {
                "task_id": task_id,
                "status": "success",
                "storage_key": stroage_key,
                "message": "Data already exists in Redis.",
            }
        else:
            logger.info(f"Fetching data for {stroage_key} from Yahoo Finance...")
            interval = interval_timeframe_map.get(time_frame, "1d")
            tickerApi = yf.Ticker(ticker=ticker)
            try:
                data = tickerApi.history(
                    start=start_date, end=end_date, interval=interval, progress=False
                )
            except TypeError:
                # Fallback for older yfinance versions that don't support progress parameter
                data = tickerApi.history(
                    start=start_date, end=end_date, interval=interval
                )
            if data.empty:
                logger.warning(
                    f"No data found for {ticker} between {start_date} and {end_date}"
                )
                return {
                    "task_id": task_id,
                    "status": "failed",
                    "message": f"No data found for {ticker} between {start_date} and {end_date}",
                }
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
                            volume=(
                                int(row["Volume"]) if not pd.isna(row["Volume"]) else 0
                            ),
                        )
                    )
                except (ValueError, KeyError, TypeError) as e:
                    logger.warning(f"Skipping malformed data point: {e}")
                    continue
                timestamp_arrays = [
                    [
                        ohlcv.timestamp if ohlcv.timestamp else 0,
                        ohlcv.open,
                        ohlcv.high,
                        ohlcv.low,
                        ohlcv.close,
                        ohlcv.volume,
                    ]
                    for ohlcv in ohlcv_data
                ]
                await api.state.redis.set(
                    stroage_key,
                    json.dumps(timestamp_arrays),
                    ex=global_settings.data_expire,
                )
            logger.info(f"Data for {stroage_key} saved to Redis.")
            task_info = await api.state.redis.get(task_id)
            if task_info:
                task_entry = TaskEntry(**json.loads(task_info))
                task_entry.storage_key = stroage_key
                await api.state.redis.set(
                    task_id,
                    json.dumps(task_entry.to_dict()),
                    ex=global_settings.task_expire,
                )
            logger.info(f"Task info for {task_id} updated in Redis.")
            return {
                "task_id": task_id,
                "status": "success",
                "storage_key": stroage_key,
                "message": "Data fetched and saved successfully.",
            }
    except Exception as e:
        logger.error(f"Failed to query Redis: {e}")
        return {"task_id": task_id, "status": "failed", "message": str(e)}


@mcp.tool()
def code_generator(task_id: str, storage_key: str, user_prompt: str) -> dict:
    """Generate code based on the task and data, return status."""
    return {"task_id": task_id, "status": "success"}


@mcp.tool()
def code_executor(task_id: str, storage_key: str) -> dict:
    """Execute the generated code and return the output."""
    return {
        "task_id": task_id,
        "status": "success",
        "output": {
            "kpis": {
                "total_return": 15.5,
                "sharpe_ratio": 1.2,
                "max_drawdown": 5.0,
                "win_rate": 60.0,
            },
            "trades": [
                {
                    "date": "2023-02-01",
                    "action": "buy",
                    "price": 800.0,
                    "quantity": 10,
                    "total_value": 8000.0,
                },
                {
                    "date": "2023-03-01",
                    "action": "sell",
                    "price": 850.0,
                    "quantity": 10,
                    "total_value": 8500.0,
                },
            ],
        },
    }


api.mount("/mcp", create_sse_server(mcp))


@api.get("/")
def read_root():
    return {"message": "Welcome! The agent is available at the /mcp/sse endpoint."}
