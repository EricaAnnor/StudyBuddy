from fastapi import APIRouter,Depends,status,HTTPException,Request
from sqlmodel import select
from .models import User,UserCreate,UserUpdate,UserResponse,Friendship,AllUser,AllUsers,Status
from .database import get_session
from passlib.context import CryptContext
from .config import Settings
from fastapi.security import OAuth2PasswordBearer
import jwt
from uuid import UUID
from collections import defaultdict


oauth2scheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")

settings = Settings()

usermanage = APIRouter(prefix="/studybuddy/v1", tags = ["User management endpoints"])

pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashpassword(password:str):
    return pwd_context.hash(password)

DEFAULT_PROFILE_PIC = "https://example.com/default-avatar.png"


@usermanage.post("/user",response_model = UserResponse)
async def createuser(data:UserCreate,request:Request,session=Depends(get_session)):

    print(await request.json())  # See what frontend sent
    query = select(User).where(User.email == data.email)
    chec = await session.execute(query)
    check = chec.scalar_one_or_none()

    if check != None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="User already exist")
    

    username = await session.execute(select(User).where(User.username == data.username))
    usernamecheck = username.scalar_one_or_none()
    

    if usernamecheck != None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="User already exist")
    
    cur_password = hashpassword(data.password)
    print(cur_password)

    user = User(
        username = data.username,
        email = data.email,
        password = cur_password,
        major = data.major,
        bio = data.bio,
        profile_pic = str(data.profile_pic) if (data.profile_pic or str(data.profile_pic).lower() == "none") else DEFAULT_PROFILE_PIC,
        login_type="local"
    )

    session.add(user)

    await session.commit()
    await session.refresh(user)

    return UserResponse(
        user_id = user.user_id,
        username = data.username,
        email = data.email,
        major = data.major,
        bio = data.bio,
        profile_pic = user.profile_pic

    )

@usermanage.patch("/user/update",response_model=UserResponse)
async def update_user(data:UserUpdate,session = Depends(get_session),token:str=Depends(oauth2scheme)):

    try:    
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = payload.get("sub")

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User not authenticated. Kindly login again",
                headers={"WWW-Authenticate": "Bearer"},
            )
        _id = UUID(_id)
        query = await session.execute(select(User).where(User.user_id == _id))
        user = query.scalar_one_or_none()

        if user is not None:
            url = ""
            for atr,value in data.model_dump(exclude_unset=True).items():
                if atr == "profile_pic":
                    url = value
                    value = str(value)
                setattr(user,atr,value)

            session.add(user)
            await session.commit()
            await session.refresh(user)

            return UserResponse(
                user_id = user.user_id,
                username = user.username,
                email = user.email,
                major = user.major,
                bio = user.bio,
                profile_pic = url

            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User not found"
            )
        
    except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    
@usermanage.delete("/user/delete")
async def delete_user(session=Depends(get_session),token=Depends(oauth2scheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = payload.get("sub")

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User not authenticated. Kindly login again",
                headers={"WWW-Authenticate": "Bearer"},
            )
        _id = UUID(_id)
        query = await session.execute(select(User).where(User.user_id == _id))
        user = query.scalar_one_or_none()

        if user is not None:
            session.delete(user)
            await session.commit()
            return {"detail": "User account deleted successfully"}

        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User not found"
            )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    

@usermanage.get("/allusers")
async def getAllUsers(session = Depends(get_session),token = Depends(oauth2scheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = payload.get("sub")

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User not authenticated. Kindly login again",
                headers={"WWW-Authenticate": "Bearer"},
            )
        _id = UUID(_id)



        query = await session.execute(select(User))
        users = query.scalars().all()

        friends_query = await session.execute(select(Friendship).where((Friendship.requester == _id) | (Friendship.receiver == _id)))
        friends = friends_query.scalars().all()

        friends_map = {}

        for friend in friends:
            other_user = friend.receiver if friend.receiver != _id else friend.requester


            #  (Friendship.receiver == _id) &
            #     (Friendship.status == Status.pending)

            is_request = (friend.receiver == _id and friend.status == Status.pending)
            friends_map[other_user] = (friend.status, is_request)



        result = []

        for user in users:
            
            if user.user_id == _id:
                continue
            
            if user.user_id in friends_map:
                cur = friends_map[user.user_id][0]
                cur2 = friends_map[user.user_id][1]
            else:
                cur = "not_friend"
                cur2 = False

            ans = AllUser(
                    user_id = user.user_id,
                    username = user.username,
                    email = user.email,
                    major = user.major,
                    bio = user.bio,
                    profile_pic = user.profile_pic,
                    isFriend = cur,
                    isFriendRequest=cur2

            )

            result.append(ans)

        return AllUsers(
            users=result
        )


    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    





        

    
        