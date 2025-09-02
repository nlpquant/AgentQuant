import asyncio
from fastapi.responses import StreamingResponse
from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route
from starlette.requests import Request


def create_sse_server(mcp: FastMCP):
    """Create a Starlette app that handles SSE connections and message handling."""
    transport = SseServerTransport("/messages/")

    async def noop():
        if False:
            yield b""

    async def handle_sse(request: Request):
        """Handles the SSE connection."""
        mcp_task = None
        try:
            async with transport.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                if mcp._mcp_server:
                    mcp_task = asyncio.create_task(
                        mcp._mcp_server.run(
                            streams[0],
                            streams[1],
                            mcp._mcp_server.create_initialization_options(),
                        )
                    )
                    await mcp_task
                else:
                    print("MCP server not initialized, likely due to LLM failure.")
        except asyncio.CancelledError:
            print("SSE connection cancelled (server is shutting down).")
            if mcp_task and not mcp_task.done():
                mcp_task.cancel()
                with asyncio.suppress(asyncio.CancelledError):
                    await mcp_task
        except Exception as e:
            print(f"INFO: An exception occurred in the SSE handler: {e}")
        finally:
            print("SSE endpoint has finished.")

        return StreamingResponse(noop())

    routes = [
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=transport.handle_post_message),
    ]

    return Starlette(routes=routes)
