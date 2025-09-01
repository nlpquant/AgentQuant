# Agent

## Prerequisites

```
uv venv --python 3.12 --seed .venv
source venv/bin/activate
uv sync
```
## Run
```
export OPENAI_API_KEY="..."
nat serve --config_file configs/config.yaml
```

## Test
```

curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "Is 4 + 4 greater than the current hour of the day?",
    "use_knowledge_base": true
}'

curl --request POST \
  --url http://localhost:8000/generate \
  --header 'Content-Type: application/json' \
  --data '{
    "input_message": "what is the following public holiday in canada",
    "use_knowledge_base": true
}'
```
