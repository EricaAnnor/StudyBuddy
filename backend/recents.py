from fastapi import APIRouter, Depends, HTTPException, status
from .database import get_session
from fastapi.security import OAuth2PasswordBearer
from .config import Settings
from .models import GroupMember,User,Groups
from .mongodb import messagesdb
import jwt
from uuid import UUID
from sqlmodel import select


recents = APIRouter(prefix="/studybuddy/v1", tags=["Recent chats"])
oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")
settings = Settings()

@recents.get("/recents")
async def get_recents(session=Depends(get_session), token=Depends(oauthscheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )
        
        # Get the group IDs the user belongs to
        grp_query = await session.execute(
            select(GroupMember.group_id).where(GroupMember.user_id == _id)
        )
        grp_res = grp_query.scalars().all()  # This will be a list of group IDs

        # MongoDB aggregation pipeline
        pipeline = [
            {
                "$match": {
                    "$or": [
                        # One-on-one chats
                        {
                            "$and": [
                                {"message_type": "one_on_one"},
                                {
                                    "$or": [
                                        {"receiver_id": str(_id)},
                                        {"sender_id": str(_id)}
                                    ]
                                }
                            ]
                        },
                        # Group chats
                        {
                            "$and": [
                                {"message_type": "group"},
                                {"group_id": {"$in": [str(gid) for gid in grp_res]}}
                            ]
                        }
                    ]
                }
            },
            {
                "$addFields": {
                    "conversation_id": {
                        "$cond": {
                            "if": {"$eq": ["$message_type", "group"]},
                            "then": "$group_id",
                            "else": {
                                "$cond": {
                                    "if": {"$eq": ["$receiver_id", str(_id)]},
                                    "then": "$sender_id",
                                    "else": "$receiver_id"
                                }
                            }
                        }
                    },
                    "conversation_type": {
                        "$cond": {
                            "if": {"$eq": ["$message_type", "group"]},
                            "then": "group",
                            "else": "one_on_one"
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "conversation_id": "$conversation_id"
                    },
                    "last_message": {"$last": "$message"},
                    "last_message_time": {"$max": "$created_at"},
                    "last_sender_id": {"$last": "$sender_id"},
                    "conv_type": {"$first":"$conversation_type"},

                    "unread_count": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ne": ["$sender_id", str(_id)]},
                                        {"$eq": ["$status", "delivered"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                "$sort": {"last_message_time": -1}
            }
        ]

        results = await messagesdb.messages.aggregate(pipeline).to_list(length=None)

        user_ids = [r["_id"]["conversation_id"] for r in results if r["conv_type"] == "one_on_one"]
        group_ids = [r["_id"]["conversation_id"] for r in results if r["conv_type"] == "group"]


        user_query = await session.execute(select(User).where(User.user_id.in_(user_ids)))
        group_query = await session.execute(select(Groups).where(Groups.group_id.in_(group_ids)))

        users = user_query.scalars().all()
        groups = group_query.scalars().all()

        user_map = {str(user.user_id): user for user in users}
        group_map = {str(group.group_id): group for group in groups}

        enriched_results = []
        
        for r in results:
            conversation_data = r.copy()  # make a mutable copy if needed
            if r["conv_type"] == "one_on_one":
                user = user_map.get(r["_id"]["conversation_id"])
                if user:
                    conversation_data["name"] = user.username
                    conversation_data["profile_pic"] = user.profile_pic
            elif r["conv_type"] == "group":
                group = group_map.get(r["_id"]["conversation_id"])
                if group:
                    conversation_data["name"] = group.group_name
                    conversation_data["profile_pic"] = group.profile_pic

            enriched_results.append(conversation_data)

        return {"results":enriched_results}


    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
