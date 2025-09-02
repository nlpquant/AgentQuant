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
COPY pyproject.toml uv.lock* .

RUN uv sync --frozen

COPY . .

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "mcp_server.main:api", "--host", "0.0.0.0", "--port", "8080"]
