# MCP Server

## Prerequisites

```
uv venv --python 3.12 --seed .venv
source .venv/bin/activate
uv sync
```
## Run
```
uv run uvicorn app.main:app --reload --port 8080
```

## Test
```
curl localhost:8080/mcp/sse
```
