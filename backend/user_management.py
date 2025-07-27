from fastapi import APIRouter,Depends,status,HTTPException
from sqlmodel import select
from .models import User,UserCreate,UserUpdate,UserResponse
from .database import get_session
from passlib.context import CryptContext
from .config import Settings
from fastapi.security import OAuth2PasswordBearer
import jwt
from uuid import UUID

oauth2scheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")

settings = Settings()

usermanage = APIRouter(prefix="/studybuddy/v1", tags = ["User management endpoints"])

pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashpassword(password:str):
    return pwd_context.hash(password)


@usermanage.post("/user",response_model = UserResponse)
async def createuser(data:UserCreate,session=Depends(get_session)):
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
        profile_pic = str(data.profile_pic),
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
        profile_pic = data.profile_pic

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
    







        

    
        