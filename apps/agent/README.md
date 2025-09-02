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
curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "Backtest RSI mean reversion strategy on SPY with 14-period RSI?"
}'


curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "Test 50/200 MA crossover strategy on AAPL from 2020-2024 and require the RSI to be below 30 at the time of purchase."
}'

curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "Backtest RSI mean reversion strategy on SPY with 14-period RSI?"
}'
```
