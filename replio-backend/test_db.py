import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect('postgresql://replio:replio@localhost:5432/replio')
        print('PostgreSQL: Connected successfully!')
        await conn.close()
    except Exception as e:
        print(f'PostgreSQL: Connection failed - {e}')

asyncio.run(test())
