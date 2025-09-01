from fastapi import FastAPI
from app.sse import create_sse_server
from mcp.server.fastmcp import FastMCP

app = FastAPI()
mcp = FastMCP("Server")


@mcp.tool()
def sum(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b


@mcp.tool()
def task_register(user_prompt: str) -> dict:
    """Register a task with the user_prompt, return a task UUID if succeeded."""
    return {"task_id": "12345", "status": "success"}


@mcp.tool()
def quick_preview(task_id: str, user_prompt: str) -> dict:
    """Provide a quick preview based on the user_prompt, return details if succeeded."""
    return {
        "task_id": task_id,
        "ticker": "TSLA",
        "time_frame": "1d",
        "start_date": "2023-01-01",
        "end_date": "2023-10-01",
        "indicators": [{"name": "RSI", "parameters": {"period": 14}}],
    }


@mcp.tool()
def yh_query_save(
    task_id: str, ticker: str, time_frame: str, start_date: str, end_date: str
) -> dict:
    """Query Yahoo Finance and save the data, return storage key if succeeded."""
    return {
        "task_id": task_id,
        "status": "success",
        "storage_key": "tsla:1d:2023-01-01:2023-10-01",
        "message": "Data saved successfully.",
    }


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


app.mount("/mcp", create_sse_server(mcp))


@app.get("/")
def read_root():
    return {"message": "Welcome! The agent is available at the /mcp/sse endpoint."}
