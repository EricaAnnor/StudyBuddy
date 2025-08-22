# from fastapi import APIRouter, WebSocket, WebSocketDisconnect,status
# import asyncio
# from .redis import redis  
# import time
# import jwt 
# from .config import Settings
# from uuid import UUID

# online_presence = APIRouter(prefix="/studybuddy/v1", tags=["Online Presence Endpoints"])

# settings = Settings()


# async def send_error(websocket: WebSocket, code: str, message: str):
#     await websocket.send_json({
#         "status": "error",
#         "code": code,
#         "message": message
#     })



# @online_presence.websocket("/presence")
# async def check_presence(websocket: WebSocket):
#     await websocket.accept()
#     token = websocket.query_params.get("token")

#     try:
#         timeout = 500
#         payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
#         _id = None
#         _id = str(UUID(payload['sub']))

#         if not _id:
#             await send_error(websocket,"NOT_AUTHORISED","User not authenticated")
#             await websocket.close(code = status.WS_1008_POLICY_VIOLATION)
#             return 

#         current = int(time.time())

#         await redis.setex(f"user:{_id}", timeout, current)
#         await redis.set(f"user:{_id}:lastseen",current)

#         while True:
#             message = await websocket.receive_text()
#             current = int(time.time())
#             if message == "heartbeat":
#                 await redis.setex(f"user:{_id}", timeout,current)
#                 await redis.set(f"user:{_id}:lastseen",current)
#                 print(f"Last seen updated {current}")

#     except jwt.PyJWTError:
#         await send_error(websocket, "INVALID_TOKEN", "Invalid or expired token")
#         await websocket.close(code=status.WS_1008_POLICY_VIOLATION)

#     except WebSocketDisconnect:
#         if _id:
#             await redis.delete(f"user:{_id}")
#         print("WebSocket disconnected")  


#   # async def monitor():
#         #     while True:
#         #         lastseen = await redis.hget("online_presence", user_id)
#         #         lastseen = float(lastseen) if lastseen else 0

#         #         if (time.time() - lastseen) >= timeout:
#         #             await redis.hdel("online_presence", user_id)
#         #             if user_id in active_connections:
#         #                 del active_connections[user_id]
#         #             break

#         #         await asyncio.sleep(5)

#         # task = asyncio.create_task(monitor())


from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
import asyncio
from .redis import redis
import time
import jwt
from .config import Settings
from uuid import UUID
import logging

online_presence = APIRouter(prefix="/studybuddy/v1", tags=["Online Presence Endpoints"])
settings = Settings()

logger = logging.getLogger(__name__)


async def send_error(websocket: WebSocket, code: str, message: str):
    """Send a JSON error response over WebSocket."""
    try:
        await websocket.send_json({
            "status": "error",
            "code": code,
            "message": message
        })
    except Exception as e:
        logger.error(f"Failed to send error message: {e}")


@online_presence.websocket("/presence")
async def check_presence(websocket: WebSocket):
    await websocket.accept()
    token = websocket.query_params.get("token")

    _id = None
    timeout = 500

    try:
        if not token:
            await send_error(websocket, "NO_TOKEN", "Authentication token missing")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Validate JWT
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if not payload or "sub" not in payload:
            await send_error(websocket, "INVALID_PAYLOAD", "Invalid token payload")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        try:
            _id = str(UUID(payload["sub"]))
        except ValueError:
            await send_error(websocket, "INVALID_SUB", "Invalid user identifier in token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Mark user as online
        current = int(time.time())
        try:
            await redis.setex(f"user:{_id}", timeout, current)
            await redis.set(f"user:{_id}:lastseen", current)
        except Exception as e:
            logger.error(f"Redis error during connection setup: {e}")
            await send_error(websocket, "REDIS_ERROR", "Internal server error")
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            return

        logger.info(f"User {_id} connected at {current}")

        # Main loop
        while True:
            try:
                message = await websocket.receive_text()
            except WebSocketDisconnect:
                logger.info(f"User {_id} disconnected")
                break
            except Exception as e:
                logger.error(f"Unexpected receive error for user {_id}: {e}")
                break

            current = int(time.time())
            if message == "heartbeat":
                try:
                    await redis.setex(f"user:{_id}", timeout, current)
                    await redis.set(f"user:{_id}:lastseen", current)
                    logger.debug(f"Heartbeat received from {_id}, last seen {current}")
                except Exception as e:
                    logger.error(f"Redis error updating heartbeat for {_id}: {e}")
                    break
            else:
                logger.warning(f"Unexpected message from {_id}: {message}")

    except jwt.PyJWTError:
        await send_error(websocket, "INVALID_TOKEN", "Invalid or expired token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)

    except Exception as e:
        logger.error(f"Unexpected error in presence websocket: {e}")
        await send_error(websocket, "SERVER_ERROR", "An unexpected error occurred")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

    finally:
        # Cleanup
        if _id:
            try:
                await redis.delete(f"user:{_id}")
                logger.info(f"User {_id} marked offline")
            except Exception as e:
                logger.error(f"Redis cleanup error for {_id}: {e}")
