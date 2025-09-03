import json
import uuid
from fastapi import FastAPI
from datetime import datetime
import pandas as pd
import yfinance as yf

from mcp_server.generator import generate_execution_code, generate_strategy_code
from mcp_server.k8s import create_job, init_k8s_client, watch_job
from mcp_server.logging import AppLogger
from mcp_server.redis import init_redis_pool
from mcp_server.sse import create_sse_server
from mcp.server.fastmcp import FastMCP
from mcp_server.models import OHLCVData, TaskEntry
from mcp_server.config import settings as global_settings
from mcp_server.ticker import (
    ohlcv_to_redis,
    query_ticker_historical_data,
    redis_to_ohlcv,
    yfinance_to_ohlcv,
)
from mcp_server.utils import compact_json_tool, safe_parse_logs


logger = AppLogger().get_logger()
api = FastAPI(logger=logger)
mcp = FastMCP("Server")
init_k8s_client(logger=logger)


@api.on_event("startup")
async def startup_event():
    logger.info("Opening redis connection pool.")
    api.state.redis = await init_redis_pool()


@api.on_event("shutdown")
async def shutdown_event():
    logger.info("Closing redis connection pool.")
    await api.state.redis.close()


@mcp.tool()
@compact_json_tool
async def task_register(user_prompt: str) -> dict:
    """Register a task with the user_prompt, return a task UUID if succeeded."""
    try:
        uid = str(uuid.uuid4())
        logger.debug(f"Registered task {uid} with prompt: {user_prompt}")
        entry = TaskEntry(user_prompt=user_prompt)
        await api.state.redis.set(
            uid, json.dumps(entry.to_dict()), ex=global_settings.task_expire
        )
    except Exception as e:
        logger.error(f"Failed to save to Redis: {e}")
        return {"task_id": uid, "status": "failed"}
    return {"task_id": uid, "status": "success"}


@mcp.tool()
@compact_json_tool
async def yh_query_save(
    task_id: str, ticker: str, time_frame: str, start_date: str, end_date: str
) -> dict:
    """Query Yahoo Finance and save the data, return storage key if succeeded."""
    try:
        stroage_key = f"{ticker}:{time_frame}:{start_date}:{end_date}"
        cached_data = await api.state.redis.get(stroage_key)
        if cached_data:
            logger.debug(f"Data for {stroage_key} already exists in Redis.")
            task_info = await api.state.redis.get(task_id)
            if task_info:
                task_entry = TaskEntry(**json.loads(task_info))
                task_entry.storage_key = stroage_key
                task_entry.ticker = ticker
                task_entry.start_date = start_date
                task_entry.end_date = end_date
                await api.state.redis.set(
                    task_id,
                    json.dumps(task_entry.to_dict()),
                    ex=global_settings.task_expire,
                )
            logger.debug(f"Task info for {task_id} updated in Redis.")
            return {"task_id": task_id, "status": "success", "storage_key": stroage_key}
        else:
            logger.info(f"Fetching data for {stroage_key} from Yahoo Finance...")
            data = query_ticker_historical_data(
                ticker, start_date, end_date, time_frame
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
            ohlcv_data = yfinance_to_ohlcv(data)
            timestamp_arrays = ohlcv_to_redis(ohlcv_data)
            await api.state.redis.set(
                stroage_key,
                json.dumps(timestamp_arrays),
                ex=global_settings.data_expire,
            )
            logger.debug(f"Data for {stroage_key} saved to Redis.")
            task_info = await api.state.redis.get(task_id)
            if task_info:
                task_entry = TaskEntry(**json.loads(task_info))
                task_entry.storage_key = stroage_key
                task_entry.ticker = ticker
                task_entry.start_date = start_date
                task_entry.end_date = end_date
                await api.state.redis.set(
                    task_id,
                    json.dumps(task_entry.to_dict()),
                    ex=global_settings.task_expire,
                )
            logger.debug(f"Task info for {task_id} updated in Redis.")
            return {
                "task_id": task_id,
                "status": "success",
                "storage_key": stroage_key
            }
    except Exception as e:
        logger.error(f"Failed to query Redis: {e}")
        return {"task_id": task_id, "status": "failed", "message": str(e)}


@mcp.tool()
@compact_json_tool
async def code_executor(task_id: str) -> dict:
    """Execute the generated code and return the output."""
    try:
        task_data = await api.state.redis.get(task_id)
        if task_data is None:
            return {"task_id": task_id, "status": "failed", "message": "Task not found"}
        task_entry = TaskEntry(**json.loads(task_data))
        storage_key = task_entry.storage_key
        if (
            task_entry.code is None
            or "init_code" not in task_entry.code
            or "next_code" not in task_entry.code
        ):
            return {"task_id": task_id, "status": "failed", "message": "Code not found"}

        strategy_code = generate_strategy_code(
            init_code=task_entry.code.get("init_code"),
            next_code=task_entry.code.get("next_code"),
        )
        execution_code = generate_execution_code(
            strategy_code=strategy_code,
            initial_cash=100000.0,
            ticker=task_entry.ticker,
            start_date=task_entry.start_date,
            end_date=task_entry.end_date,
        )
        job = create_job(task_id, storage_key, execution_code, logger=logger)
        result = watch_job(job, timeout=global_settings.job_runner_timeout)
        if result["success"]:
            try:
                logs_json = safe_parse_logs(result["logs"])
                task_entry.execute_status = "success"
                task_entry.execute_output = json.dumps(logs_json)
                await api.state.redis.set(
                    task_id,
                    json.dumps(task_entry.to_dict()),
                    ex=global_settings.task_expire,
                )
            except Exception as e:
                logger.error(f"Failed to parse logs: {e}")
                return {
                    "task_id": task_id,
                    "status": "failed",
                    "message": "Logs are not valid JSON",
                }
            return {
                "task_id": task_id,
                "status": "success",
                "output": {
                    "kpis": logs_json.get("kpis", {}),
                },
            }
    except Exception as e:
        logger.error(f"Code execution failed: {e}")
        return {"task_id": task_id, "status": "failed", "message": str(e)}
    task_entry.execute_status = "failed"
    await api.state.redis.set(
        task_id,
        json.dumps(task_entry.to_dict()),
        ex=global_settings.task_expire,
    )
    return {"task_id": task_id, "status": "failed", "message": "Job failed"}


api.mount("/mcp", create_sse_server(mcp))


@api.get("/")
def read_root():
    return {"message": "Welcome! The agent is available at the /mcp/sse endpoint."}


@api.get("/data/{storage_key}")
async def get_data(storage_key: str):
    """Fetch data from Redis by storage key."""
    try:
        cached_data = await api.state.redis.get(storage_key)
        if cached_data:
            logger.debug(f"Data for {storage_key} retrieved from Redis.")
            return {"data": redis_to_ohlcv(json.loads(cached_data))}
        else:
            logger.warning(f"No data found for {storage_key} in Redis.")
            return {"error": "Data not found"}, 404
    except Exception as e:
        logger.error(f"Failed to query Redis: {e}")
        return {"error": str(e)}, 500


@api.get("/result/{task_id}")
async def get_data(task_id: str):
    """Fetch task result from Redis by task ID."""
    try:
        task_data = await api.state.redis.get(task_id)
        if task_data:
            task_entry = TaskEntry(**json.loads(task_data))
            code_output = json.loads(task_entry.execute_output)
            return {"data": code_output}
        else:
            logger.warning(f"No task result found for {task_id} in Redis.")
            return {"error": "Task result not found"}, 404
    except Exception as e:
        logger.error(f"Failed to query Redis: {e}")
        return {"error": str(e)}, 500
