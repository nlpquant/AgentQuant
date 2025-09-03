import ast
import datetime
import functools
import json
from threading import Lock

from mcp_server.models import OHLCVData


class SingletonMeta(type):
    """
    This is a thread-safe implementation of Singleton.
    """

    _instances = {}

    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]



def safe_parse_logs(logs: str) -> dict:
    try:
        return json.loads(logs)
    except json.JSONDecodeError:
        try:
            return ast.literal_eval(logs)
        except Exception:
            return {}


def compact_json_tool(tool_fn):
    """Decorator that JSON-encodes the return value in compact form."""

    @functools.wraps(tool_fn)
    async def wrapper(*args, **kwargs):
        try:
            result = await tool_fn(*args, **kwargs)
            return json.dumps(result, separators=(",", ":"), ensure_ascii=False)
        except Exception as e:
            print(f"Error in {tool_fn.__name__}: {e}")
            return json.dumps(
                {"error": str(e)}, separators=(",", ":"), ensure_ascii=False
            )
    return wrapper
