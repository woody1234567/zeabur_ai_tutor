import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from src.tools.mcp_manager import MCPManager


def create_manager() -> MCPManager:
    manager = object.__new__(MCPManager)
    manager._client = None
    manager._tools = None
    manager._init_lock = asyncio.Lock()
    return manager


class MCPManagerTest(unittest.IsolatedAsyncioTestCase):
    async def test_retries_then_commits_successful_client(self):
        manager = create_manager()
        tool = MagicMock(name="tool")
        tool.name = "search_problems"

        failed_clients = [MagicMock(), MagicMock()]
        for client in failed_clients:
            client.get_tools = AsyncMock(side_effect=ConnectionError("not ready"))
        successful_client = MagicMock()
        successful_client.get_tools = AsyncMock(return_value=[tool])

        with patch(
            "src.tools.mcp_manager.MultiServerMCPClient",
            side_effect=[*failed_clients, successful_client],
        ) as client_factory, patch(
            "src.tools.mcp_manager.asyncio.sleep", new=AsyncMock()
        ) as sleep:
            ready = await manager.init_client(
                max_attempts=3,
                initial_delay_seconds=0.01,
                max_delay_seconds=0.02,
                timeout_seconds=1,
            )

        self.assertTrue(ready)
        self.assertTrue(manager.is_ready)
        self.assertIs(manager._client, successful_client)
        self.assertEqual(manager.get_all_tools(), [tool])
        self.assertEqual(client_factory.call_count, 3)
        self.assertEqual(sleep.await_count, 2)

    async def test_failure_remains_retryable(self):
        manager = create_manager()
        failed_client = MagicMock()
        failed_client.get_tools = AsyncMock(side_effect=ConnectionError("not ready"))

        with patch(
            "src.tools.mcp_manager.MultiServerMCPClient",
            return_value=failed_client,
        ):
            ready = await manager.init_client(
                max_attempts=1,
                initial_delay_seconds=0,
                timeout_seconds=1,
            )

        self.assertFalse(ready)
        self.assertFalse(manager.is_ready)
        self.assertIsNone(manager._client)
        self.assertIsNone(manager._tools)

        tool = MagicMock(name="tool")
        tool.name = "test"
        successful_client = MagicMock()
        successful_client.get_tools = AsyncMock(return_value=[tool])

        with patch(
            "src.tools.mcp_manager.MultiServerMCPClient",
            return_value=successful_client,
        ):
            recovered = await manager.init_client(
                max_attempts=1,
                initial_delay_seconds=0,
                timeout_seconds=1,
            )

        self.assertTrue(recovered)
        self.assertTrue(manager.is_ready)
        self.assertEqual(manager.get_all_tools(), [tool])

    async def test_concurrent_initialization_discovers_once(self):
        manager = create_manager()
        client = MagicMock()
        client.get_tools = AsyncMock(return_value=[])

        with patch(
            "src.tools.mcp_manager.MultiServerMCPClient", return_value=client
        ) as client_factory:
            results = await asyncio.gather(
                manager.init_client(max_attempts=1, timeout_seconds=1),
                manager.init_client(max_attempts=1, timeout_seconds=1),
            )

        self.assertEqual(results, [True, True])
        self.assertTrue(manager.is_ready)
        self.assertEqual(client_factory.call_count, 1)
        client.get_tools.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
