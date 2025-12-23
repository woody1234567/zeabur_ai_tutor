from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from .state import AgentState

from src.tools.mcp_manager import mcp_manager

# --- Real MCP Tools Wrappers ---

async def search_problems_tool(query: str, filters: dict = None):
    tool = mcp_manager.get_tool("search_problems")
    if not tool:
        return [{"error": "Tool 'search_problems' not available"}]
    
    # Map arguments to what the tool expects
    # The tool likely expects a single string input or a specific schema.
    # If the tool is structured, we might need to pass a dict.
    # For now, let's assume it takes a query string.
    # We might need to adjust this based on the actual tool definition.
    return await tool.ainvoke({"query": query, "limit": filters.get("limit") if filters else 5})

async def recommend_materials_tool(query: str):
    tool = mcp_manager.get_tool("recommend_materials")
    if not tool:
        return [{"error": "Tool 'recommend_materials' not available"}]
    return await tool.ainvoke({"studentId": "default-student", "limit": 5}) # Adjusted args based on typical usage

async def read_class_materials_tool(query: str, classroom_id: str):
    # This might use a resource or a tool. 
    # If it is a tool:
    # tool = mcp_manager.get_tool("read_class_materials")
    # if tool: return await tool.ainvoke(...)
    return [{"id": "cm1", "title": "Lecture Notes (Mock)", "content": "Real implementation pending resource integration."}]

async def read_problems_tool(problem_ids: list):
    # Pending resource implementation
    return [{"id": "p1", "explanation": "Detailed explanation (Mock)..."}]



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
