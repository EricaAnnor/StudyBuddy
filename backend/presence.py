from fastapi import APIRouter, WebSocket, WebSocketDisconnect,status
import asyncio
from .redis import redis  
import time
import jwt 
from .config import Settings
from uuid import UUID

online_presence = APIRouter(prefix="/studybuddy/v1", tags=["Online Presence Endpoints"])

settings = Settings()


async def send_error(websocket: WebSocket, code: str, message: str):
    await websocket.send_json({
        "status": "error",
        "code": code,
        "message": message
    })



@online_presence.websocket("/presence")
async def check_presence(websocket: WebSocket):
    await websocket.accept()
    token = websocket.query_params.get("token")

    try:
        timeout = 500
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = str(UUID(payload['sub']))

        current = int(time.time())

        await redis.setex(f"user:{_id}", timeout, current)

        while True:
            message = await websocket.receive_text()
            current = int(time.time())
            if message == "heartbeat":
                await redis.setex(f"user:{_id}", timeout,current)
                print(f"Last seen updated {current}")

    except jwt.PyJWTError:
        await send_error(websocket, "INVALID_TOKEN", "Invalid or expired token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return   

    except WebSocketDisconnect:
        await redis.delete(f"user:{_id}")
        return   


  # async def monitor():
        #     while True:
        #         lastseen = await redis.hget("online_presence", user_id)
        #         lastseen = float(lastseen) if lastseen else 0

        #         if (time.time() - lastseen) >= timeout:
        #             await redis.hdel("online_presence", user_id)
        #             if user_id in active_connections:
        #                 del active_connections[user_id]
        #             break

        #         await asyncio.sleep(5)

        # task = asyncio.create_task(monitor())