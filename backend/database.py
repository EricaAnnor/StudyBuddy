from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker
from sqlalchemy.ext.asyncio.session import AsyncSession
from .config import Settings


settings = Settings()

postgresurl = f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}@db:{settings.postgres_port}/{settings.postgres_name}"

engine = create_async_engine(
    url = postgresurl
    
)

async_session = async_sessionmaker(
    engine,
    class_ = AsyncSession,
    expire_on_commit=True

)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    async with async_session() as session:
        yield session

