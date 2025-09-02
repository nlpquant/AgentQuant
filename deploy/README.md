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
