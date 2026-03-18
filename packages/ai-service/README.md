# AI Service (FastAPI + LangGraph)

This service provides tutor chat streaming for the Nuxt app.

## Environment variables

Create `packages/ai-service/.env` from `.env.example`:

```bash
cd packages/ai-service
cp .env.example .env
```

Required variables:

- `OPENAI_API_KEY`: API key for LLM calls
- `MCP_SERVER_URL`: Nuxt MCP endpoint
  - local: `http://localhost:3000/mcp`
  - Zeabur: `http://web:3000/mcp` (replace `web` with your Nuxt service name)
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
