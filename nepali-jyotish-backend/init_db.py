import asyncio
from database.connection import engine, Base
# Import all models so SQLAlchemy knows which tables to create
from database.schemas import User, BirthDetails, AstroProfile, RashifalCache


async def init_models():
    print("Connecting to Supabase and creating tables...")
    async with engine.begin() as conn:
        # This line actually creates the tables in your Supabase database
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    try:
        asyncio.run(init_models())
    except Exception as e:
        print(f"❌ Error creating tables: {e}")