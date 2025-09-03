# Docker deployment

## Start the services

```
cd deploy
docker-compose up -d
docker-compose ps
```

## Restart the services when code changes

```
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
```

## Access the kind cluster

```
cd kind
source .envrc # if no direnv installed
kubectl config get-contexts
```

## Reset persistent data
```
docker-compose down --volumes
```
