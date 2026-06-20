import asyncio
import os
from typing import List, Optional

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient


def _positive_int_env(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def _non_negative_float_env(name: str, default: float) -> float:
    try:
        return max(0.0, float(os.getenv(name, str(default))))
    except ValueError:
        return default


class MCPManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._client: Optional[MultiServerMCPClient] = None
            instance._tools: Optional[List[BaseTool]] = None
            instance._init_lock = asyncio.Lock()
            cls._instance = instance
        return cls._instance

    @property
    def is_ready(self) -> bool:
        """Whether MCP discovery completed successfully, including zero tools."""
        return self._client is not None and self._tools is not None

    async def init_client(
        self,
        *,
        max_attempts: Optional[int] = None,
        initial_delay_seconds: Optional[float] = None,
        max_delay_seconds: Optional[float] = None,
        timeout_seconds: Optional[float] = None,
    ) -> bool:
        """Connect to MCP and cache tools, retrying transient startup failures.

        Client state is committed only after tool discovery succeeds. A failed
        initialization therefore remains retryable instead of permanently
        caching an empty tool list.
        """
        if self.is_ready:
            return True

        attempts = max_attempts or _positive_int_env("MCP_CONNECT_MAX_ATTEMPTS", 8)
        delay = (
            initial_delay_seconds
            if initial_delay_seconds is not None
            else _non_negative_float_env("MCP_CONNECT_INITIAL_DELAY_SECONDS", 0.5)
        )
        max_delay = (
            max_delay_seconds
            if max_delay_seconds is not None
            else _non_negative_float_env("MCP_CONNECT_MAX_DELAY_SECONDS", 5.0)
        )
        timeout = (
            timeout_seconds
            if timeout_seconds is not None
            else _non_negative_float_env("MCP_CONNECT_TIMEOUT_SECONDS", 5.0)
        )
        attempts = max(1, attempts)
        delay = max(0.0, delay)
        max_delay = max(delay, max_delay)
        timeout = max(0.1, timeout)

        async with self._init_lock:
            if self.is_ready:
                return True

            mcp_server_url = os.getenv(
                "MCP_SERVER_URL", "http://localhost:3000/mcp"
            )

            for attempt in range(1, attempts + 1):
                candidate = MultiServerMCPClient(
                    connections={
                        "nuxt-server": {
                            "url": mcp_server_url,
                            "transport": "http",
                        }
                    }
                )

                try:
                    print(
                        f"Connecting to MCP server {mcp_server_url} "
                        f"(attempt {attempt}/{attempts})"
                    )
                    tools = await asyncio.wait_for(
                        candidate.get_tools(), timeout=timeout
                    )
                except Exception as error:
                    print(
                        f"MCP discovery failed on attempt {attempt}/{attempts}: "
                        f"{error}"
                    )
                    if attempt < attempts:
                        await asyncio.sleep(delay)
                        delay = min(max_delay, max(delay * 2, 0.1))
                    continue

                self._client = candidate
                self._tools = list(tools)
                print(
                    f"Loaded {len(self._tools)} MCP tools: "
                    f"{[tool.name for tool in self._tools]}"
                )
                return True

            # Keep both fields unset so a later request can recover.
            self._client = None
            self._tools = None
            print(
                f"MCP server unavailable after {attempts} attempts; "
                "the next chat request will retry discovery"
            )
            return False

    def get_all_tools(self) -> List[BaseTool]:
        """Return a snapshot of the currently loaded MCP tools."""
        return list(self._tools) if self._tools is not None else []

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """Retrieve a loaded MCP tool by name."""
        if self._tools is None:
            return None
        return next((tool for tool in self._tools if tool.name == name), None)

    async def get_resource(self, uri: str) -> Optional[str]:
        """Read a text resource, recovering MCP discovery if necessary."""
        if not self.is_ready:
            await self.init_client(max_attempts=1)
        if not self._client:
            print("MCP client is not available")
            return None

        try:
            async with self._client.session("nuxt-server") as session:
                result = await session.read_resource(uri)
                if result.contents:
                    return result.contents[0].text
                return None
        except Exception as error:
            print(f"Failed to read MCP resource {uri}: {error}")
            return None


mcp_manager = MCPManager()
