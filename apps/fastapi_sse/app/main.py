import os
from fastapi import FastAPI
from app.sse import create_sse_server
from mcp.server.fastmcp import FastMCP

# --- Main Application Setup ---
app = FastAPI()

# 1. FIX: Properly initialize the Language Model.
# You must provide a language model for MCP to decide which tool to use.
# NOTE: You may need to set an API key for your chosen model, for example:
# os.environ["OPENAI_API_KEY"] = "your-api-key-here"


# 2. FIX: Initialize FastMCP with the required 'llm' instance.
# The @mcp.tool() decorators below will register functions to this instance.
mcp = FastMCP("Server")

# --- Tool Definitions ---
# Your tool definitions using decorators are correct.
@mcp.tool()
def get_weather(city: str, unit: str = "celsius") -> str:
    """Get weather for a city."""
    return f"Weather in {city}: 22 degrees {unit[0].upper()}"

@mcp.tool()
def sum(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

# --- Routing ---

# 3. FIX: Mount the agent server on a specific path to avoid conflicts.
# Mounting on "/" conflicts with the @app.get("/") endpoint below.
app.mount("/mcp", create_sse_server(mcp))

# This root endpoint is now accessible and won't conflict with the agent.
@app.get("/")
def read_root():
    return {"message": "Welcome! The agent is available at the /mcp/sse endpoint."}
