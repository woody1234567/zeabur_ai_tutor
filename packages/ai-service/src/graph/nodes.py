from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from .state import AgentState

# --- Mock Tools / Services for now ---
async def search_problems_tool(query: str, filters: dict = None):
    return [{"id": "p1", "title": "Sample Problem", "content": "Integration logic..."}]

async def recommend_materials_tool(query: str):
    return [{"id": "m1", "title": "Calculus Video", "url": "http://example.com"}]

async def read_class_materials_tool(query: str, classroom_id: str):
    return [{"id": "cm1", "title": "Lecture Notes", "content": "Chapter 1..."}]

async def read_problems_tool(problem_ids: list):
    return [{"id": "p1", "explanation": "Detailed explanation..."}]


# --- Nodes ---

async def intent_classifier_node(state: AgentState, config: RunnableConfig):
    """
    Classifies the user's intent based on the last message.
    Real implementation would call an LLM here.
    """
    last_msg = state["messages"][-1].content.lower()
    
    # transform mock logic
    intent = "unclear"
    if "concept" in last_msg or "explain" in last_msg:
        intent = "concept_confusion"
    elif "practice" in last_msg or "problem" in last_msg:
        intent = "practice_request"
    elif "material" in last_msg or "note" in last_msg:
        intent = "material_lookup"
    
    return {"intent": intent}


# --- Routers ---
# These nodes prepare the state for specific downstream actions
# In a real app, they might extract entities/queries via LLM

async def concept_router_node(state: AgentState, config: RunnableConfig):
    # Prepare query for concept search
    last_msg = state["messages"][-1].content
    return {"search_query": last_msg}

async def practice_router_node(state: AgentState, config: RunnableConfig):
    last_msg = state["messages"][-1].content
    return {"search_query": last_msg, "search_filters": {"limit": 5}}

async def material_router_node(state: AgentState, config: RunnableConfig):
    last_msg = state["messages"][-1].content
    return {"search_query": last_msg}


# --- Action Nodes ---

async def recommend_materials_action(state: AgentState, config: RunnableConfig):
    query = state.get("search_query", "")
    results = await recommend_materials_tool(query)
    # Tag results so we know where they came from
    tagged = [{"type": "material_recommendation", "data": r} for r in results]
    return {"tool_results": tagged}

async def search_problems_action(state: AgentState, config: RunnableConfig):
    query = state.get("search_query", "")
    filters = state.get("search_filters", {})
    results = await search_problems_tool(query, filters)
    tagged = [{"type": "problem_search", "data": r} for r in results]
    return {"tool_results": tagged}

async def read_problems_action(state: AgentState, config: RunnableConfig):
    # This might need extraction of problem IDs if user asked for explanation of specific result
    # For now mock:
    results = await read_problems_tool(["p1"])
    tagged = [{"type": "problem_explanation", "data": r} for r in results]
    return {"tool_results": tagged}

async def read_class_materials_action(state: AgentState, config: RunnableConfig):
    query = state.get("search_query", "")
    cls_id = state.get("classroom_id", "default_class")
    results = await read_class_materials_tool(query, cls_id)
    tagged = [{"type": "class_material", "data": r} for r in results]
    return {"tool_results": tagged}


async def fallback_node(state: AgentState, config: RunnableConfig):
    return {"final_response": {"type": "text", "content": "I'm not sure how to help with that. Could you try asking about concepts, practice problems, or class materials?"}}


async def merge_results_node(state: AgentState, config: RunnableConfig):
    """
    Aggregates results from multiple branches.
    """
    tools_out = state.get("tool_results", [])
    # Flatten or format as needed
    summary = f"Found {len(tools_out)} items."
    return {"messages": [SystemMessage(content=summary)], "final_response": {"type": "mixed", "items": tools_out}}
