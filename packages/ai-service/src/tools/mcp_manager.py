import os
from typing import List, Optional
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import BaseTool

class MCPManager:
    _instance = None
    _client: Optional[MultiServerMCPClient] = None
    _tools: Optional[List[BaseTool]] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MCPManager, cls).__new__(cls)
        return cls._instance

    async def init_client(self):
        """Initializes the MCP client and fetches tools."""
        if self._client:
            return

        mcp_server_url = os.getenv("MCP_SERVER_URL", "http://localhost:3000/mcp")
        print(f"🔌 Connecting to MCP Server: {mcp_server_url}")
        self._client = MultiServerMCPClient(connections={
            "nuxt-server": {
                "url": mcp_server_url,
                "transport": "http"
            }
        })
        
        # Pre-fetch tools to verify connection and cache them
        try:
            print("🛠️ Fetching MCP Tools...")
            self._tools = await self._client.get_tools()
            print(f"✅ Loaded {len(self._tools)} MCP tools: {[t.name for t in self._tools]}")
        except Exception as e:
            print(f"❌ Failed to fetch tools: {e}")
            self._tools = []

    def get_all_tools(self) -> List[BaseTool]:
        """Return all loaded MCP tools."""
        return list(self._tools) if self._tools else []

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """Retrieves a specific tool by name."""
        if not self._tools:
            return None
        return next((t for t in self._tools if t.name == name), None)

    async def get_resource(self, uri: str) -> Optional[str]:
        """Retrieves and reads a specific resource by URI."""
        if not self._client:
            print("❌ MCP Client not initialized")
            return None

        try:
            # We explicitly use the 'nuxt-server' session to access low-level MCP methods
            async with self._client.session("nuxt-server") as session:
                result = await session.read_resource(uri)
                # result.contents is a list of TextResourceContent or BlobResourceContent
                if result.contents and len(result.contents) > 0:
                    # Return the text content of the first item
                    # (Assuming text resource for now)
                    return result.contents[0].text
                return None
        except Exception as e:
            print(f"❌ Failed to read resource {uri}: {e}")
            return None

# Global instance
mcp_manager = MCPManager()
