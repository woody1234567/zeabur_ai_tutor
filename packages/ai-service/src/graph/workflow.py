from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    intent_classifier_node,
    concept_router_node,
    practice_router_node,
    material_router_node,
    recommend_materials_action,
    search_problems_action,
    read_problems_action,
    read_class_materials_action,
    fallback_node,
    merge_results_node,
)

# Define the graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("intent_classifier", intent_classifier_node)

workflow.add_node("concept_router", concept_router_node)
workflow.add_node("practice_router", practice_router_node)
workflow.add_node("material_router", material_router_node)

workflow.add_node("fallback", fallback_node)

# Concept Branch Nodes
workflow.add_node("action_concept_material", recommend_materials_action)
workflow.add_node("action_concept_problem", search_problems_action)
workflow.add_node("merge_results", merge_results_node)

# Practice Branch Nodes
workflow.add_node("action_practice_search", search_problems_action)
workflow.add_node("action_practice_explain", read_problems_action)

# Material Branch Node
workflow.add_node("action_material_read", read_class_materials_action)


# Add Edges

# 1. Entry Point
workflow.set_entry_point("intent_classifier")

# 2. Conditional Routing
def route_intent(state: AgentState):
    intent = state.get("intent")
    if intent == "concept_confusion":
        return "concept_router"
    elif intent == "practice_request":
        return "practice_router"
    elif intent == "material_lookup":
        return "material_router"
    else:
        return "fallback"

workflow.add_conditional_edges(
    "intent_classifier",
    route_intent,
    {
        "concept_router": "concept_router",
        "practice_router": "practice_router",
        "material_router": "material_router",
        "fallback": "fallback",
    }
)

# 3. Concept Branch
# Parallel execution for concept: Router -> (Material + Problem) -> Merge
workflow.add_edge("concept_router", "action_concept_material")
workflow.add_edge("concept_router", "action_concept_problem")

workflow.add_edge("action_concept_material", "merge_results")
workflow.add_edge("action_concept_problem", "merge_results")

workflow.add_edge("merge_results", END)

# 4. Practice Branch
# For now, simple routing. In reality could be conditional D -> D1 or D2
workflow.add_edge("practice_router", "action_practice_search")
workflow.add_edge("action_practice_search", END)
# (Optionally add edge to explain if needed in future)

# 5. Material Branch
workflow.add_edge("material_router", "action_material_read")
workflow.add_edge("action_material_read", END)

# 6. Fallback
workflow.add_edge("fallback", END)


# Compile the graph
app_graph = workflow.compile()
