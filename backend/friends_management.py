from fastapi import APIRouter,Depends,HTTPException,status
from sqlmodel import select
from .database import get_session
from fastapi.security import OAuth2PasswordBearer
import jwt
from .models import Friend_Payload,Friendship,User,Status,UpdateFriendRequest,Friends_Response
from .config import Settings
from uuid import UUID


friendmanage = APIRouter(prefix="/studybuddy/v1",tags=["Friend management endpoints"])
Oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")
settings = Settings()


@friendmanage.post("/friend/sendrequest")
async def sendfriendrequest(data:Friend_Payload,session=Depends(get_session),token=Depends(Oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        if data.friend_id == _id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot send a friend request to yourself."
            )

        
        receiver_exist_query = await session.execute(select(User).where(User.user_id == data.friend_id))
        receiver_exist = receiver_exist_query.scalar_one_or_none()

        if receiver_exist is None:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Receiver not found"
            )
        
        check_friendship_query = await session.execute(select(Friendship).where(
            ((Friendship.requester == _id) & (Friendship.receiver == data.friend_id)) | 
            ((Friendship.requester == data.friend_id)  & (Friendship.receiver == _id))
        ))

        check_friendship = check_friendship_query.scalar_one_or_none()

        if check_friendship is not None:
            # if check_friendship.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = f"Friend request has already been sent.Status:{check_friendship.status} "
            )


        request = Friendship(
            requester=_id,
            receiver = data.friend_id,
            status = "pending"
        )

        session.add(request)

        await session.commit()

        return {
            "detail": "Request successfully sent"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")




@friendmanage.patch("/friend/update/request")
async def update_friend_request(data:UpdateFriendRequest,session=Depends(get_session),token=Depends(Oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        receiver_exist_query = await session.execute(select(User).where(User.user_id == data.friend_id))
        receiver_exist = receiver_exist_query.scalar_one_or_none()

        if receiver_exist is None:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "friend not found"
            )
        
        query = await session.execute(
            select(Friendship).where(
                (Friendship.requester == data.friend_id) & (Friendship.receiver == _id)
            )
        )

        check = query.scalar_one_or_none()

        if check is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = "Friendship does not exist"
            )
        
        check.status = data.status
        session.add(check)
        await session.commit()

        return {
            "detail": f"Friend request successfully {data.status}"
        }
    except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@friendmanage.delete("/friend/remove")
async def remove_friend(data:Friend_Payload,session = Depends(get_session),token=Depends(Oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        if data.friend_id == _id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot send a friend request to yourself."
            )

        
        receiver_exist_query = await session.execute(select(User).where(User.user_id == data.friend_id))
        receiver_exist = receiver_exist_query.scalar_one_or_none()

        if receiver_exist is None:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail = "Receiver not found"
            )
        
        check_friendship_query = await session.execute(select(Friendship).where(
            ((Friendship.requester == _id) & (Friendship.receiver == data.friend_id)) | 
            ((Friendship.requester == data.friend_id)  & (Friendship.receiver == _id))
        ))

        check_friendship = check_friendship_query.scalar_one_or_none()

        if check_friendship is  None:
            # if check_friendship.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = f"Friendship does not exist"
            )
        
        if check_friendship.status != Status.accepted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = "You can only remove accepted friends"
            )

        
        await session.delete(check_friendship)
        await session.commit()

        return {
            "detail": "Friend removed"
        }
    except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@friendmanage.get("/friends", response_model=Friends_Response)
async def get_friends(token=Depends(Oauthscheme), session=Depends(get_session)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )

        query = await session.execute(
            select(Friendship).where(
                ((Friendship.receiver == _id) | (Friendship.requester == _id)) &
                (Friendship.status == Status.accepted)
            )
        )

        friends = query.scalars().all()
        user_friends = []
        res_friends = []

        if friends:

            for friend in friends:
                if friend.receiver != _id:
                    user_friends.append(friend.receiver)
                if friend.requester != _id:  
                    user_friends.append(friend.requester)

        friends_query = await session.execute(select(User).where(User.user_id.in_(user_friends)))
        res_friends = friends_query.scalars().all()

        return {"friends":res_friends}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@friendmanage.get("/friend-requests", response_model=Friends_Response)
async def get_friend_requests(token=Depends(Oauthscheme), session=Depends(get_session)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )

        query = await session.execute(
            select(Friendship).where(
                (Friendship.receiver == _id) &
                (Friendship.status == Status.pending)
            )
        )

        friends = query.scalars().all()

        user_requesters = []
        if friends:
            requester_ids = [f.requester for f in friends]
            query_ = await session.execute(select(User).where(User.user_id.in_(requester_ids)))
            user_requesters = query_.scalars().all()

        return {
                "friends": user_requesters
            }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")