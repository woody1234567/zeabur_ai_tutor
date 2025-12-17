from typing import TypedDict, Annotated, List, Optional, Any
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    """
    State for the AI Tutor Graph.
    """
    # The conversation history.
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Metadata context
    user_id: Optional[str]
    classroom_id: Optional[str]
    
    # Intent classification result
    intent: Optional[str]
    
    # Derived queries/params for tools
    search_query: Optional[str]
    search_filters: Optional[dict]
    
    # Results from parallel branches to be merged
    tool_results: Annotated[List[Any], operator.add]
    
    # Final response to be sent
    final_response: Optional[dict]
