import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from dotenv import load_dotenv

# Path to backend .env
backend_env = "/Users/nirdosh/Desktop/nepali-jyotish-backend/.env"
load_dotenv(backend_env)

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_db():
    if not DATABASE_URL:
        print("DATABASE_URL not found in backend .env")
        return
    print(f"Connecting to: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"Result: {result.scalar()}")
            
            result = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Tables found: {tables}")
    except Exception as e:
        print(f"Error connecting to database: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db())
