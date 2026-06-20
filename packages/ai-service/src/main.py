import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Any
from dotenv import load_dotenv

from contextlib import asynccontextmanager

# Load local development settings before importing modules that construct
# OpenAI clients. Existing process variables from Docker/Zeabur take priority.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from src.tools.mcp_manager import mcp_manager
from src.graph.workflow import stream_chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mcp_manager.init_client()
    yield


app = FastAPI(title="AI Tutor Chat Service", lifespan=lifespan)


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    messages: List[dict] = []           # Full conversation history from Nuxt DB
    classroom_id: Optional[str] = None


@app.get("/")
def health_check():
    return {"status": "ok", "service": "ai-service"}


@app.post("/chat/stream")
async def chat_stream_endpoint(req: ChatRequest):
    """SSE streaming chat endpoint."""
    return StreamingResponse(
        stream_chat(
            message=req.message,
            user_id=req.user_id or "default_user",
            messages=req.messages,
            classroom_id=req.classroom_id,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """Synchronous chat endpoint (backward compat) — collects full stream."""
    full_response = ""
    async for chunk in stream_chat(
        message=req.message,
        user_id=req.user_id or "default_user",
        messages=req.messages,
        classroom_id=req.classroom_id,
    ):
        # Each chunk is an SSE line like "data: {...}\n\n"
        if chunk.startswith("data: "):
            try:
                data = json.loads(chunk[6:].strip())
                if data.get("type") == "done":
                    full_response = data.get("content", "")
            except Exception:
                pass

    return {"response": full_response}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
