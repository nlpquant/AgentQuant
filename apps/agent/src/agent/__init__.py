import asyncio
from agent.redis import init_redis

asyncio.get_event_loop().run_until_complete(init_redis())
