from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from langchain_core.messages import HumanMessage
from src.graph.workflow import app_graph

from contextlib import asynccontextmanager
from src.tools.mcp_manager import mcp_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load MCP tools on startup
    await mcp_manager.init_client()
    yield
    # Clean up if needed

app = FastAPI(title="AI Tutor Chat Service", lifespan=lifespan)

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    classroom_id: Optional[str] = None
    role: Optional[str] = "user"

class ChatResponse(BaseModel):
    response: Any
    intent: Optional[str]
    tool_results: Optional[List[Any]]

@app.get("/")
def health_check():
    return {"status": "ok", "service": "ai-service"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Process a chat message through the LangGraph workflow.
    """
    initial_state = {
        "messages": [HumanMessage(content=req.message)],
        "user_id": req.user_id,
        "classroom_id": req.classroom_id,
        "tool_results": []
    }
    
    try:
        # Invoke the graph
        final_state = await app_graph.ainvoke(initial_state)
        
        # Extract response
        # If 'final_response' is set in state (e.g. fallback or merge)
        response_data = final_state.get("final_response")
        
        # If no explicit final response, maybe use tool results or messages
        if not response_data:
            response_data = {"messages": [m.content for m in final_state["messages"]]}

        return {
            "response": response_data,
            "intent": final_state.get("intent"),
            "tool_results": final_state.get("tool_results")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
