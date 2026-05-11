import json
from typing import AsyncGenerator, Optional, List
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage

from src.tools.mcp_manager import mcp_manager


def build_system_prompt(user_id: str, classroom_id: Optional[str]) -> str:
    return f"""You are a helpful AI Tutor assistant.
Student ID: {user_id}
{f"Classroom ID: {classroom_id}" if classroom_id else ""}

You can:
- Recommend practice problems (use search_problems tool)
- Recommend class materials (use recommend_materials tool with studentId={user_id})
- Explain concepts and problem solutions in detail
- Answer questions about course content

Always respond in the same language the student uses.
When recommending resources, briefly explain why they're relevant."""


def convert_messages(raw_messages: List[dict]) -> List[BaseMessage]:
    """Convert DB message format dicts to LangChain BaseMessage objects."""
    result: List[BaseMessage] = []
    for msg in raw_messages:
        role = msg.get("role", "")
        content = msg.get("content") or ""
        if role == "user":
            result.append(HumanMessage(content=content))
        elif role == "assistant":
            # Skip messages with no text content (e.g. tool_call-only turns)
            if content:
                result.append(AIMessage(content=content))
        # Skip tool/system messages — they're reconstructed by the agent
    return result


def create_agent(user_id: str, classroom_id: Optional[str] = None):
    llm = ChatOpenAI(model="gpt-4o", streaming=True, temperature=0.3)
    tools = mcp_manager.get_all_tools()
    system = build_system_prompt(user_id, classroom_id)
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=system,
    )


async def stream_chat(
    message: str,
    user_id: str,
    messages: List[dict],
    classroom_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """Convert LangGraph astream_events to SSE-formatted strings."""
    history = convert_messages(messages)
    history.append(HumanMessage(content=message))

    agent = create_agent(user_id, classroom_id)
    full_response = ""

    async for event in agent.astream_events({"messages": history}, version="v2"):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content:
                full_response += chunk.content
                yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

        elif kind == "on_tool_start":
            tool_name = event.get("name", "")
            yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

        elif kind == "on_tool_end":
            tool_name = event.get("name", "")
            output = event["data"].get("output", "")
            yield f"data: {json.dumps({'type': 'tool_result', 'tool': tool_name, 'result': str(output)})}\n\n"

    yield f"data: {json.dumps({'type': 'done', 'content': full_response})}\n\n"
