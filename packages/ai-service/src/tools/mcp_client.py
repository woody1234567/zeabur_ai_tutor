import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient

async def fetch_mcp_tools_and_resources():
    """
    Connects to the local Nuxt MCP server and fetches capabilities.
    """
    print("Initializing MultiServerMCPClient...")
    # Assuming the Nuxt MCP module exposes SSE at /api/_mcp
    # This is the default for nuxt-mcp-toolkit or similar implementations
    client = MultiServerMCPClient(connections={
        "nuxt-server": {
            "url": "http://localhost:3000/mcp",
            "transport": "http"
        }
    })

    try:
        # Note: MultiServerMCPClient might not need a context manager if it manages per-call sessions,
        # but explicit connection management is often good. 
        # However, the docs say it operates in a stateless manner by default.
        # Let's try calling get_tools() directly.
        
        print("Fetching tools...")
        tools = await client.get_tools()
        print(f"✅ Found {len(tools)} tools:")
        for tool in tools:
            # Tool is likely a LangChain BaseTool, so it has .name and .description
            print(f"  - {tool.name}: {tool.description}")

        print("\nFetching resources...")
        resources = await client.get_resources()
        print(f"✅ Found {len(resources)} resources:")
        for resource in resources:
            # Resource structure depends on the underlying MCP SDK, likely has .name, .uri, .mimeType
            # LangChain adapters might wrap this.
            print(f"  - {resource}")

    except Exception as e:
        print(f"❌ Error fetching MCP capabilities: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fetch_mcp_tools_and_resources())
