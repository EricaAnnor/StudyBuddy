from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from .redis import redis  
import time

online_presence = APIRouter(prefix="/studybuddy/v1", tags=["Online Presence Endpoints"])

active_connections = {}

@online_presence.websocket("/presence")
async def check_presence(websocket: WebSocket, user_id: str):
    await websocket.accept()

    timeout = 30

    await redis.hset("online_presence", user_id, time.time())

    if user_id not in active_connections:
        active_connections[user_id] = websocket

    async def monitor():
        while True:
            lastseen = await redis.hget("online_presence", user_id)
            lastseen = float(lastseen) if lastseen else 0

            if (time.time() - lastseen) >= timeout:
                await redis.hdel("online_presence", user_id)
                if user_id in active_connections:
                    del active_connections[user_id]
                break

            await asyncio.sleep(5)

    task = asyncio.create_task(monitor())

    try:
        while True:
            message = await websocket.receive_text()
            if message == "heartbeat":
                await redis.hset("online_presence", user_id, time.time())

            await asyncio.sleep(5)  

    except WebSocketDisconnect:
        await redis.hdel("online_presence", user_id)
        if user_id in active_connections:
            del active_connections[user_id]
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
