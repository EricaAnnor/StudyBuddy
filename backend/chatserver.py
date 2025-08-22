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

# active_connections = {}
sender_connections = {}
receiver_connections = {}



@chat.websocket("/send")
async def sendmessage(websocket: WebSocket, session=Depends(get_session)):
    await websocket.accept()
    token = websocket.query_params.get("token")
    sender_id = None

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            await send_error(websocket, "NOT_AUTHORISED", "User not authenticated")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        sender_id = str(_id)
        print(f"User {sender_id} connected to send messages")

        while True:
            try:
                raw_data = await websocket.receive_json()
                data = SendMessage(**raw_data)
                print(f"Received message from {sender_id}: {data}")

                current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

                if data.messagetype == "group":
                    result = await session.execute(select(Groups).where(Groups.group_id == data.group_id))
                    group = result.scalar_one_or_none()
                    
                    if not group:
                        await send_error(websocket, "GROUP_NOT_FOUND", "Group does not exist")
                        continue 
                    
                    group_members_query = await session.execute(select(GroupMember).where(GroupMember.group_id == data.group_id))
                    group_members = group_members_query.scalars().all()

                    db_batch = []
                    publish_tasks = []

                    for member in group_members:
                        member_id = str(member.user_id)
                        
                        message_id = str(uuid4())
                        current_msg = {
                            "message_id": message_id,
                            "message": data.message,
                            "attachments": data.attachments or [],
                            "sender_id": sender_id,
                            "receiver_id": member_id,
                            "message_type": data.messagetype,
                            "group_id": str(data.group_id),
                            "created_at": current_time,
                            "status": "sent"
                        }
                        db_batch.append(current_msg)

                        # Prepare for Redis publish
                        queue_input = {
                            "message_id": message_id,
                            "message": data.message,
                            "attachments": data.attachments or [],
                            "sender_id": sender_id,
                            "receiver_id": member_id,
                            "message_type": data.messagetype,
                            "group_id": str(data.group_id),
                            "created_at": current_time,
                            "status": "sent"
                        }
                        
                        # Publish to Redis
                        publish_tasks.append(
                            redis.publish(f"receiver_id:{member_id}", json.dumps(queue_input))
                        )
                        print(f"Queued message for group member {member_id}")

                    # Save to database
                    await messagesdb.messages.insert_many(db_batch)
                    
                    # Publish all messages to Redis
                    await asyncio.gather(*publish_tasks)
                    
                    # Confirm to sender
                    await websocket.send_json({
                        "status": "success",
                        "message": "Group message sent",
                        "message_count": len(db_batch)
                    })

                elif data.messagetype == "one_on_one":
                    receiver_id = data.user_id

                    # Check if receiver and sender are friends
                    query = await session.execute(select(Friendship).where(
                        ((Friendship.receiver == UUID(sender_id)) & (Friendship.requester == receiver_id)) |
                        ((Friendship.requester == UUID(sender_id)) & (Friendship.receiver == receiver_id))
                    ))
                    
                    check = query.scalar_one_or_none()

                    # If not friends, check if they are in the same group
                    if not check:
                        grp_query = await session.execute(
                            select(GroupMember.group_id).where(
                                GroupMember.user_id.in_([UUID(sender_id), receiver_id])
                            ).group_by(GroupMember.group_id).having(
                                func.count(GroupMember.user_id.distinct()) == 2
                            )
                        )

                        check_grp = grp_query.scalar_one_or_none()

                        if check_grp is None:
                            await send_error(websocket, "NOT_ALLOWED", f"You cannot send message to this user: {receiver_id}")
                            continue
                        
                        else:
                            usersettingsquery = await session.execute(select(UserSettings).where(UserSettings.user_id == receiver_id))
                            usersettings = usersettingsquery.scalar_one_or_none()

                            if usersettings and usersettings.allow_messages_if_in_the_same_group is False:
                                await send_error(websocket, "NOT_ALLOWED", f"You cannot send message to this user: {receiver_id}")
                                continue

                    receiver_id = str(receiver_id)
                    message_id = str(uuid4())
                    
                    # Create message object
                    current = {
                        "message_id": message_id,
                        "message": data.message,
                        "attachments": data.attachments or [],
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "message_type": data.messagetype,
                        "created_at": current_time,
                        "status": "sent"
                    }
                    
                    # Save to database
                    await messagesdb.messages.insert_one(current)
                    print(f"Saved message to database: {message_id}")

                    # Prepare message for Redis
                    queue_input = {
                        "message_id": message_id,
                        "message": data.message,
                        "attachments": data.attachments or [],
                        "sender_id": sender_id,
                        "receiver_id": receiver_id,
                        "message_type": data.messagetype,
                        "created_at": current_time,
                        "status": "sent"
                    }
            
                    # Publish to Redis for receiver
                    await redis.publish(f"receiver_id:{receiver_id}", json.dumps(queue_input))
                    print(f"Published message to Redis for receiver {receiver_id}")

                    # Also send to sender (for their own chat view)
                    sender_queue_input = queue_input.copy()
                    sender_queue_input["status"] = "sent"
                    await redis.publish(f"receiver_id:{sender_id}", json.dumps(sender_queue_input))
                    print(f"Published message to Redis for sender {sender_id}")

                    # Confirm to sender via WebSocket
                    await websocket.send_json({
                        "status": "success",
                        "message_id": message_id,
                        "message": "Message sent successfully"
                    })

            except WebSocketDisconnect:
                print(f"User {sender_id} disconnected from send")
                break
            except Exception as e:
                print(f"Error processing message from {sender_id}: {e}")
                await send_error(websocket, "SERVER_ERROR", str(e))
                continue

    except WebSocketDisconnect:
        print(f"User {sender_id} disconnected during auth")
    except Exception as e:
        print(f"Auth error for send connection: {e}")
        await send_error(websocket, "CONNECTION_ERROR", str(e))
    finally:
        print(f"Cleaning up send connection for user {sender_id}")

async def send_error(websocket: WebSocket, code: str, message: str):
    try:
        if websocket.client_state == websocket.client_state.CONNECTED:
            await websocket.send_json({
                "status": "error",
                "code": code,
                "message": message
            })
    except Exception as e:
        print(f"Could not send error message: {e}")
        # Connection already closed, ignore


@chat.websocket("/receive")
async def receive_messages(websocket: WebSocket):
    await websocket.accept()
    token = websocket.query_params.get("token")
    user_id = None
    
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = str(UUID(payload["sub"]))
        
        print(f"User {user_id} connected to receive messages")
        
        # Store the connection - this is what pub/sub uses
        receiver_connections[user_id] = websocket
        
        # Keep connection alive and handle disconnects
        try:
            while True:
                # Wait for any client messages (like heartbeat/ping)
                try:
                    # Set a timeout to detect disconnects faster
                    message = await asyncio.wait_for(
                        websocket.receive_text(), 
                        timeout=30.0
                    )
                    # Echo back any pings
                    if message == "ping":
                        await websocket.send_text("pong")
                except asyncio.TimeoutError:
                    # Send a ping to check if connection is alive
                    try:
                        await websocket.send_text("ping")
                    except:
                        break
                except:
                    break
                    
        except Exception as e:
            print(f"Connection error for user {user_id}: {e}")
            
    except Exception as e:
        print(f"Auth error: {e}")
        await websocket.close(code=1008)
    finally:
        # Clean up
        if user_id and user_id in receiver_connections:
            del receiver_connections[user_id]
            print(f"User {user_id} disconnected from receive")