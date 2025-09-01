# Agent

## Prerequisites

```
uv venv --python 3.12 --seed .venv
source .venv/bin/activate
uv sync
```
## Run
```
export OPENAI_API_KEY="..."
uv run nat serve --config_file configs/config.yaml
```

## Test
```
➜ curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "Backtest RSI mean reversion strategy on SPY with 14-period RSI?",
    "use_knowledge_base": true
}'
```
