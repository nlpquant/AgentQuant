# from mcp.server.fastmcp import FastMCP
# from mcp.server.sse import SseServerTransport
# from starlette.applications import Starlette
# from starlette.routing import Mount, Route

# def create_sse_server(mcp: FastMCP):
#     """Create a Starlette app that handles SSE connections and message handling"""
#     transport = SseServerTransport("/messages/")

#     # Define handler functions
#     async def handle_sse(request):
#         async with transport.connect_sse(
#             request.scope, request.receive, request._send
#         ) as streams:
#             await mcp._mcp_server.run(
#                 streams[0], streams[1], mcp._mcp_server.create_initialization_options()
#             )

#     # Create Starlette routes for SSE and message handling
#     routes = [
#         Route("/sse/", endpoint=handle_sse),
#         Mount("/messages/", app=transport.handle_post_message),
#     ]

#     # Create a Starlette app
#     return Starlette(routes=routes)

from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route
from starlette.requests import Request

def create_sse_server(mcp: FastMCP):
    """Create a Starlette app that handles SSE connections and message handling."""
    # FIX: Align the transport path with the mount point in main.py.
    # The client is trying to POST to "/mcp/messages/", so this is the full path.
    transport = SseServerTransport("/messages/")

    async def handle_sse(request: Request):
        """Handles the SSE connection."""
        try:
            async with transport.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                if mcp._mcp_server:
                    await mcp._mcp_server.run(
                        streams[0], streams[1], mcp._mcp_server.create_initialization_options()
                    )
                else:
                    print("MCP server not initialized, likely due to LLM failure.")
        except Exception as e:
            print(f"ERROR: An exception occurred in the SSE handler: {e}")

    # These paths are relative to the mount point ("/mcp").
    # "/sse/" becomes "/mcp/sse/" when mounted.
    # "/messages/" becomes "/mcp/messages/" when mounted.
    routes = [
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=transport.handle_post_message),
    ]

    return Starlette(routes=routes)

