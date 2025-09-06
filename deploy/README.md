# Docker deployment

## Start the services

```
cd deploy
export OPENAI_API_KEY='...'
export LLM_GENERIC_MODEL_NAME='qwen-plus-2025-07-28'
export LLM_CODER_MODEL_NAME='qwen3-coder-plus'

docker-compose up -d
docker-compose ps
```

## Check healthcheck states
```
docker inspect agentquant-redis --format='{{json .State.Health}}' | jq
docker inspect agentquant-mcp-server --format='{{json .State.Health}}' | jq
docker inspect agentquant-agent --format='{{json .State.Health}}' | jq
```

## Restart the service when code changes

```
docker-compose up mcp-server --build -d
docker-compose up agent --build -d
```

## Access the kind cluster

```
export KUBECONFIG=$(PWD)/kind/kubeconfig.yaml
kubectl config get-contexts
```

## Reset persistent data

```
docker-compose down --volumes
```

## Recreate the kind cluster

```
docker-compose exec kind sh -c "kind delete cluster --name my-cluster"
docker-compose restart kind
```
