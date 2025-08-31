# AgentQuant Project Guidelines

## Language Policy
- **English Only**: All code, comments, documentation, commit messages, and project communication must be in English
- No Chinese text allowed in any part of the codebase

## Project Info
- Quantitative trading platform combining AI agents with financial data analysis
- Full-stack monorepo: Next.js frontend + FastAPI backend
- Built with Turborepo, pnpm, TypeScript, Python 3.12

## Development Setup
- Use `pnpm install` to install all dependencies (automatically runs `uv sync` for Python)
- Commands: `pnpm dev`, `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm check-types`
- ESLint 8.x for compatibility with Next.js config
- Ruff + MyPy for Python linting and type checking

## License
- **TBD** - Considering AGPL v3 for strong copyleft protection
- Part of an open source initiative
- Will ensure all derivatives remain open source