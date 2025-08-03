from fastapi import FastAPI
from .test import test_ui
from .chatserver import chat
from .presence import online_presence
from contextlib import asynccontextmanager
from .database import create_db_and_tables
from .chatserver_pubsub import message_pubsub
from .user_management import usermanage
import asyncio
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from .config import Settings
from .auth import authendpoints
from .group_management import groupmanage
from .friends_management import friendmanage
from .usersettings import user_setting
from .uploadfile import file_endpoint

settings = Settings()

@asynccontextmanager
async def lifespan(app:FastAPI):
    await create_db_and_tables()
    pubsub = asyncio.create_task(message_pubsub())
    yield
    pubsub.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret
)

app.include_router(test_ui)
app.include_router(chat)
app.include_router(online_presence)
app.include_router(usermanage)
app.include_router(authendpoints)
app.include_router(groupmanage)
app.include_router(friendmanage)
app.include_router(user_setting)
app.include_router(file_endpoint)


@app.post("/welcome")
def welcome():
    return {"message":"hello world"}

