from .redis import redis
from .presence import active_connections
import json
from .mongodb import messagesdb
from bson import ObjectId

async def message_pubsub():
    pubsub = redis.pubsub()

    await pubsub.psubscribe("receiver_id:*")

    async for message in pubsub.listen():
        if message["type"] == "pmessage":
            try:
                channel = message["channel"].decode()  
                receiver_id = channel.split(":")[1]

                data = json.loads(message["data"].decode())

                if receiver_id in active_connections:
                    connection = active_connections[receiver_id]
                    if connection:
                        await connection.send_json(
                            {   
                                "status":"delivered",
                                "data":data
                                
                                }
                            
                            )

                        await messagesdb.messages.update_one(
                            {"_id": ObjectId(data["_id"])},  
                            {"$set": {"status": "delivered"}}
                        )
            except Exception as e:
                print("Error handling message:", e)
