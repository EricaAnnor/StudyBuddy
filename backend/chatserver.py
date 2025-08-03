from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends,status,HTTPException
from .models import SendMessage, User, Groups,Friendship,UserSettings,GroupMember
from sqlalchemy import func
from .redis import redis
from sqlmodel import select
from .database import get_session
from .mongodb import messagesdb
import datetime
import json
# from fastapi.security import OAuth2PasswordBearer
import jwt
from .config import Settings
from uuid import UUID,uuid4
import asyncio

chat = APIRouter(prefix="/studybuddy/v1/chat", tags=["Chat service endpoints"])
# oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")
settings = Settings()

active_connections = {}


async def send_error(websocket: WebSocket, code: str, message: str):
    await websocket.send_json({
        "status": "error",
        "code": code,
        "message": message
    })


@chat.websocket("/send")
async def sendmessage(websocket: WebSocket, session=Depends(get_session)):
    await websocket.accept()

    # token = websocket.headers.get("authorization")
    
    # if token is None or not token.startswith("Bearer "):
    #     websocket.close(code = status.WS_1008_POLICY_VIOLATION)
    #     return 
    
    # token = token[7:]
    token = websocket.query_params.get("token")

    try:

        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            await send_error(websocket,"NOT_AUTHORISED","User not authenticated")
            await websocket.close(code = status.WS_1008_POLICY_VIOLATION)
            return 


        sender_id = _id 
        while True:
            try:
                raw_data = await websocket.receive_json()
                data = SendMessage(**raw_data)

                if sender_id not in active_connections:
                    active_connections[str(sender_id)] = websocket

                current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

                if data.messagetype == "group":
                    result = await session.execute(select(Groups).where(Groups.group_id == data.group_id))
                    group = result.scalar_one_or_none()
                    
                    if not group:
                        await websocket.send_json({
                            "status":"error",
                            "data":"Group does not exist"
                        })
                        continue 
                    
                    group_members_query = await session.execute(select(GroupMember).where(GroupMember.group_id == data.group_id))
                    group_members = group_members_query.scalars().all()

                    pipe = []
                    db_batch = []

                    for member in group_members:
                        member_id = member.user_id
                        member_id= str(member_id)
                        user_exists = await redis.exists(f"user:{member_id}") 
                        if user_exists:

                            connection = active_connections.get(member_id)
                        else:
                            connection = None
                        current = {
                            "message_id":str(uuid4()),
                            "message": data.message,
                            "attachments":data.attachments or [],
                            "sender_id": str(sender_id),
                            "receiver_id": str(member_id),
                            "message_type": data.messagetype,
                            "created_at": current_time,
                            "status":"pending"
                        }
                        db_batch.append(current)

                        message_id = str(current["message_id"])

                        queue_input = {
                            "message_id":str(message_id),
                            "message": data.message,
                            "attachments": data.attachments or [],
                            "sender_id": str(sender_id),
                            "receiver_id": str(member_id),
                            "message_type": data.messagetype,
                            "created_at": current_time,
                            "status":"pending"
                        }
                        if connection:

                            pipe.append(redis.publish(f"receiver_id:{member_id}", json.dumps(queue_input)))

                    messagesdb.messages.insert_many(db_batch)
                    await asyncio.gather(*pipe)

                elif data.messagetype == "one_on_one":
                    receiver_id = data.user_id

                    #check if receiver and sender are friends
                    query = await session.execute(select(Friendship).where(
                        ((Friendship.receiver == sender_id) & (Friendship.requester == receiver_id)) |
                        ((Friendship.requester == sender_id) & (Friendship.receiver == receiver_id))
                        
                        ) )
                    
                    check = query.scalar_one_or_none()

                    # if not friends check if they are in the same group and user's accept_messages_if_in group us true
                    if not check:
                        grp_query = await session.execute(
                            select(GroupMember.group_id).where(GroupMember.user_id.in_([sender_id,receiver_id])).group_by(
                                GroupMember.group_id
                            ).having(func.count(GroupMember.user_id.distinct()) == 2)
                        )

                        check_grp = grp_query.scalar_one_or_none()

                        if check_grp is None:
                            await send_error(websocket,"NOT_ALLOWED",f"You cannot send message to this user: {receiver_id}")
                            continue
                        
                        else:
                            usersettingsquery = await session.execute(select(UserSettings).where(UserSettings.user_id == receiver_id))

                            usersettings = usersettingsquery.scalar_one_or_none()

                            if usersettings  and  usersettings.allow_messages_if_in_the_same_group is  False:
                                await send_error(websocket,"NOT_ALLOWED",f"You cannot send message to this user: {receiver_id}")
                                continue

                    receiver_id = str(receiver_id)
                    receiver_exists = await redis.exists(f"user:{receiver_id}") 
                    sender_exists = await redis.exists(f"user:{sender_id}")
                    connection = active_connections.get(receiver_id) if receiver_exists else None
                    sender_connection = active_connections.get(sender_id) if sender_exists else None
                    

                    current = {
                        "message_id":str(uuid4()),
                        "message": data.message,
                        "attachments": data.attachments or [],
                        "sender_id": str(sender_id),
                        "receiver_id": str(receiver_id),
                        "message_type": data.messagetype,
                        "created_at": current_time,
                    }
                    result = await messagesdb.messages.insert_one(current)
                    message_id = str(current["message_id"])

                    queue_input = {
                        "message_id":message_id,
                        "message": data.message,
                        "attachments": data.attachments or [],
                        "sender_id": str(sender_id),
                        "receiver_id": str(receiver_id),
                        "message_type": data.messagetype,
                        "status":"pending"
                    }
            
                    if connection:
                        # await connection.send_json(data.message)
                        await redis.publish(f"receiver_id:{receiver_id}", json.dumps(queue_input))

                    if sender_connection:
                        await redis.publish(f"receiver_id:{sender_id}", json.dumps(queue_input))
                print("ACTIVE CONNECTIONS:", list(active_connections.keys()))
            except Exception as e:
                await send_error(websocket, "SERVER_ERROR", str(e))
                continue

    except WebSocketDisconnect:
        if sender_id and sender_id in active_connections:
            del active_connections[str(sender_id)]

        print("server disconnected")