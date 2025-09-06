# Use official Python 3.12 slim image
FROM python:3.12-slim

# Install curl (required to fetch uv)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install uv (static binary)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy project files
COPY agent/pyproject.toml ./agent/
COPY agent/uv.lock ./agent/
COPY mcp-server/ ./mcp-server

WORKDIR /app/agent

RUN uv sync --frozen

COPY agent/src ./src
COPY agent/configs ./configs

CMD ["uv", "run", "nat", "serve", "--config_file", "configs/config.yaml", "--host", "0.0.0.0", "--port", "8000"]