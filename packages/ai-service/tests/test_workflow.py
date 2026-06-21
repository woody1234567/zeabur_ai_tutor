import unittest
from unittest.mock import MagicMock, patch

from src.graph.workflow import build_system_prompt, create_agent


class WorkflowTest(unittest.TestCase):
    @patch("src.graph.workflow.create_react_agent")
    @patch("src.graph.workflow.ChatOpenAI")
    @patch("src.graph.workflow.mcp_manager.get_all_tools")
    def test_create_agent_passes_system_prompt_with_current_langgraph_api(
        self,
        get_all_tools: MagicMock,
        chat_openai: MagicMock,
        create_react_agent_mock: MagicMock,
    ):
        tools = [MagicMock()]
        model = MagicMock()
        expected_agent = MagicMock()
        get_all_tools.return_value = tools
        chat_openai.return_value = model
        create_react_agent_mock.return_value = expected_agent

        agent = create_agent("student-1", "classroom-1")

        self.assertIs(agent, expected_agent)
        create_react_agent_mock.assert_called_once_with(
            model=model,
            tools=tools,
            prompt=build_system_prompt("student-1", "classroom-1"),
        )


if __name__ == "__main__":
    unittest.main()
