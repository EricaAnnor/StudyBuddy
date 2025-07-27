from motor.motor_asyncio import AsyncIOMotorClient
from .config import Settings

settings = Settings()

MONGO_URI = f"mongodb://{settings.mongo_user}:{settings.mongo_password}@mongo:{settings.mongo_port}/?authSource=admin"

client = AsyncIOMotorClient(MONGO_URI)

messagesdb = client["chatmessages"]
