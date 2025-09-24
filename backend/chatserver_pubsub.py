from .redis import redis
from .chatserver import receiver_connections
import json
from .mongodb import messagesdb
from bson import ObjectId
import asyncio

async def message_pubsub():
    print("Starting Redis pub/sub listener...")
    
    while True:  # Keep retrying if connection fails
        try:
            pubsub = redis.pubsub()
            await pubsub.psubscribe("receiver_id:span*")
            print("Successfully subscribed to receiver_id:* pattern")

            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    try:
                        channel = message["channel"].decode()  
                        receiver_id = channel.split(":")[1]
                        data = json.loads(message["data"].decode())
                        
                        print(f"Received message for user {receiver_id}: {data}")

                        if receiver_id in receiver_connections:
                            connection = receiver_connections[receiver_id]
                            if connection:
                                try:
                                    await connection.send_json({   
                                        "status": "delivered",
                                        "data": data
                                    })
                                    
                                    # Update message status in database
                                    await messagesdb.messages.update_one(
                                        {"message_id": data["message_id"]},  
                                        {"$set": {"status": "delivered"}}
                                    )
                                    print(f"Message delivered to user {receiver_id}")
                                    
                                except Exception as ws_error:
                                    print(f"WebSocket error for user {receiver_id}: {ws_error}")
                                    # Remove dead connection
                                    if receiver_id in receiver_connections:
                                        del receiver_connections[receiver_id]
                        else:
                            print(f"User {receiver_id} not connected")
                            
                    except Exception as e:
                        print(f"Error handling message: {e}")
                        
        except Exception as e:
            print(f"Redis pub/sub error: {e}")
            await asyncio.sleep(5)  # Wait before retrying
            print("Retrying Redis connection...")