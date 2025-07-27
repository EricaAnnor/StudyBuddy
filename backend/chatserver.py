from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends,status,HTTPException
from .models import SendMessage, User, Groups
from .redis import redis
from .presence import active_connections
from sqlmodel import select
from .database import get_session
from .mongodb import messagesdb
import datetime
import json
# from fastapi.security import OAuth2PasswordBearer
import jwt
from .config import Settings
from uuid import UUID

chat = APIRouter(prefix="/studybuddy/v1/chat", tags=["Chat service endpoints"])
# oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")
settings = Settings()


@chat.websocket("/send")
async def sendmessage(websocket: WebSocket, session=Depends(get_session)):
    # payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

    # _id = UUID(payload["sub"])

    # if not _id:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="User is not authenticated"
    #     )

    await websocket.accept()

    sender_id = None 
    try:
        while True:
            raw_data = await websocket.receive_json()
            data = SendMessage(**raw_data)

            sender_id = str(data.sender_id)
            if sender_id not in active_connections:
                active_connections[sender_id] = websocket

            current_time = datetime.datetime.now(datetime.timezone.utc)

            if data.messagetype == "group":
                result = session.execute(select(Groups).where(Groups.group_id == data.group_id))
                group = result.scalar_one_or_none()
                
                if not group:
                    await websocket.send_json({
                        "status":"error",
                        "error":"Group does not exist"
                    })
                    continue 

                for member_id in group.members:
                    member_id_str = str(member_id)
                    connection = active_connections.get(member_id_str)
                    current = {
                        "message": data.message,
                        "sender_id": sender_id,
                        "receiver_id": str(member_id),
                        "message_type": data.messagetype,
                        "created_at": current_time,
                        "status":"pending"
                    }
                    result = await messagesdb.messages.insert_one(current)
                    message_id = result.inserted_id

                    queue_input = {
                        "message_id":str(message_id),
                        "message": data.message,
                        "sender_id": sender_id,
                        "receiver_id": str(member_id),
                        "message_type": data.messagetype,
                        "created_at": current_time,
                        "status":"pending"
                    }
                    if connection:

                        await redis.publish(f"receiver_id:{str(member_id)}",json.dumps(queue_input))

            elif data.messagetype == "one_on_one":
                receiver_id = str(data.user_id)
                connection = active_connections.get(receiver_id)

                current = {
                    "message": data.message,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message_type": data.messagetype,
                    "created_at": current_time,
                }
                result = await messagesdb.messages.insert_one(current)
                message_id = result.inserted_id

                queue_input = {
                    "message_id":str(message_id),
                    "message": data.message,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message_type": data.messagetype,
                    "status":"pending"
                }
        
                if connection:
                    # await connection.send_json(data.message)
                    await redis.publish(f"receiver_id:{receiver_id}", json.dumps(queue_input))
            print("ACTIVE CONNECTIONS:", list(active_connections.keys()))

    except WebSocketDisconnect:
        if sender_id and sender_id in active_connections:
            del active_connections[sender_id]

        print("server disconnected")