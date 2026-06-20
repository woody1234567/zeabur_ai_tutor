# AI Service (FastAPI + LangGraph)

This service provides tutor chat streaming for the Nuxt app.

## Environment variables

Create `packages/ai-service/.env` from `.env.example`:

```bash
cd packages/ai-service
cp .env.example .env
```

Keep real secrets in `.env`. The committed `.env.example` file is only a
template and is not loaded by the service.

Required variables:

- `OPENAI_API_KEY`: API key for LLM calls
- `MCP_SERVER_URL`: Nuxt MCP endpoint
  - local: `http://localhost:3000/mcp`
  - Zeabur: `http://web:3000/mcp` (replace `web` with your Nuxt service name)
- `MCP_CONNECT_MAX_ATTEMPTS`: startup discovery attempts (default: `8`)
- `MCP_CONNECT_INITIAL_DELAY_SECONDS`: initial retry delay (default: `0.5`)
- `MCP_CONNECT_MAX_DELAY_SECONDS`: retry delay cap (default: `5`)
- `MCP_CONNECT_TIMEOUT_SECONDS`: timeout for each discovery attempt (default: `5`)
- `PYTHONUNBUFFERED`: recommended `1` for real-time logs

## Run locally

```bash
cd packages/ai-service
uv run uvicorn src.main:app --reload --port 8000
```

## Endpoints

- `GET /` health check
- `POST /chat/stream` SSE streaming chat
- `POST /chat` synchronous compatibility endpoint

## Architecture notes

- **Production chat path** uses:
  - `src/main.py` -> `src/graph/workflow.py`
- `workflow.py` builds a LangGraph ReAct agent with MCP tools from Nuxt (`http://localhost:3000/mcp`).

### About `src/graph/nodes.py`

`nodes.py` currently contains experimental/legacy node prototypes and mock wrappers.
It is **not** the active path for the current `/chat/stream` runtime flow.

If you refactor the graph architecture, either:
1. migrate these nodes into the active workflow and wire them explicitly, or
2. remove the file to avoid confusion.
