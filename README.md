# AgentQuant

AgentQuant is a full-stack quantitative trading platform that combines AI agents with financial data analysis and backtesting capabilities.

## Architecture

This is a monorepo built with Turborepo that includes:

### Apps

- **`web`** - Next.js 15 frontend application with React 19
- **`api`** - FastAPI backend for quantitative trading operations

### Tech Stack

**Frontend:**
- Next.js 15 with App Router
- React 19
- TypeScript
- ESLint + Prettier

**Backend:**  
- FastAPI with Python 3.12
- UV for dependency management
- Ruff for linting and formatting
- MyPy for type checking
- Pytest for testing
- yfinance, backtrader, pandas, numpy

**Tools:**
- Turborepo for monorepo orchestration
- pnpm for package management
- Claude Context for semantic search

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12
- pnpm
- UV (Python package manager)

### Installation

```bash
# Clone and install all dependencies (Node.js + Python)
git clone <repo-url>
cd AgentQuant
pnpm install  # Automatically runs uv sync for Python deps
```

### Development

```bash
# Start all development servers
pnpm dev

# Start specific app
pnpm dev --filter=web    # Frontend only
pnpm dev --filter=api    # Backend only
```

The web app runs on http://localhost:3000 and the API on http://localhost:8000.

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers for all apps |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Lint all code (TypeScript + Python) |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format all code with Prettier + Ruff |
| `pnpm check-types` | Type check TypeScript + Python |
| `pnpm test` | Run all tests |

## Project Structure

```
AgentQuant/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App Router pages
│   │   ├── public/         # Static assets
│   │   └── package.json
│   └── api/                # FastAPI backend
│       ├── agent_quant_api/
│       │   ├── main.py     # FastAPI app
│       │   └── __init__.py
│       ├── tests/          # Pytest tests
│       └── pyproject.toml
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # Workspace configuration
└── package.json           # Root package.json
```

## Features

- 🚀 **Modern Stack** - Latest Next.js, React, FastAPI
- 📦 **Monorepo** - Turborepo for efficient builds and caching
- 🔧 **Developer Experience** - Hot reloading, type safety, linting
- 🧪 **Testing** - Pytest for API, ready for frontend tests
- 📊 **Financial Data** - yfinance integration for market data
- 🔄 **Backtesting** - backtrader for strategy testing
- 🤖 **AI Ready** - Built to integrate with AI trading agents

## Contributing

1. Install dependencies: `pnpm install`
2. Follow the existing code style (ESLint + Ruff)
3. Run tests: `pnpm test`
4. Ensure type checking passes: `pnpm check-types`

## License

**License: TBD** - Considering AGPL v3 or other strong copyleft license.

This project is planned as part of an open source initiative and will adopt a strict open source license to ensure code and derivatives remain open source.
