import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient

async def inspect():
    client = MultiServerMCPClient(connections={
        "nuxt-server": {
            "url": "http://localhost:3000/mcp",
            "transport": "http"
        }
    })
    
    print("Methods on client:")
    for attr in dir(client):
        if not attr.startswith("_"):
            print(f"- {attr}")

    print("\nFetching resources...")
    resources = await client.get_resources()
    if resources:
        first = resources[0]
        print("First resource type:", type(first))
        print("First resource dir:", dir(first))
        print("First resource vars:", vars(first))
    
    # Check session
    print("\nChecking session...")
    try:
        async with client.session("nuxt-server") as session:
            print("Session type:", type(session))
            print("Session dir:", dir(session))
            if hasattr(session, "read_resource"):
                print("Session has read_resource!")
                res = await session.read_resource("testbank://list")
                print("Result type:", type(res))
                print("Result:", res)
    except Exception as e:
        print(f"Session error: {e}")


if __name__ == "__main__":
    asyncio.run(inspect())
