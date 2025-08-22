from .models import User,Token,RefreshRequest,UserLogin,UserResponse
from fastapi import Response,Request,Depends,HTTPException,status,APIRouter
from sqlmodel import select
from .database import get_session
from .oauth import oauth
from .user_management import pwd_context
import jwt
import re
from datetime import timedelta,timezone,datetime
from .config import Settings
from fastapi.security import OAuth2PasswordRequestForm

settings = Settings()


authendpoints = APIRouter(prefix="/studybuddy/v1",tags=["Authentication endpoints"])

def verify(cur_password:str,hashed:str):
    return pwd_context.verify(cur_password,hashed)

def is_email(value: str) -> bool:
    return "@" in value and re.match(r"[^@]+@[^@]+\.[^@]+", value)



async def verify_user(username_or_email, plain_password,session):

 
    
    print("Checking by email...")
    query = select(User).where(User.email == username_or_email)
    print("email in use") 

    check = await session.execute(query)
    result = check.scalar_one_or_none() 

    if result == None:
        print("No user found.")
        return False

    print("Fetched user:", result)

    hashed_password = result.password
    return verify(plain_password, hashed_password)

   


def create_access_token(data:dict,expire_time: timedelta|None = None):
    encode_data = data.copy()

    if expire_time:
        expire = datetime.now(timezone.utc) + timedelta(minutes= settings.accessexpiretime)

    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    encode_data.update({"exp":expire})

    encoded_jwt = jwt.encode(encode_data, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt
     
def create_refresh_token(data:dict,expire_time: timedelta|None = None):
    encode_data = data.copy()

    if expire_time:
        expire = datetime.now(timezone.utc) + timedelta(days = settings.refreshtime)

    else:
        expire = datetime.now(timezone.utc) + timedelta(days = 7)

    encode_data.update({"exp":expire})

    encoded_jwt = jwt.encode(encode_data,settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt 


@authendpoints.post("/login",response_model=Token)
async def login(response: Response, data: OAuth2PasswordRequestForm = Depends(),session=Depends(get_session)) -> Token:
    print("checkkkkk")
    check = await verify_user(data.username, data.password,session)
  

    if not check:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    query = await session.execute(select(User).where(User.email == data.username))
    user = query.scalar_one_or_none()

    access_token = create_access_token(
        {   "sub": str(user.user_id),
            "email": data.username,

        },
        timedelta(minutes=settings.accessexpiretime)
    )
    refresh_token = create_refresh_token(
        {   "sub": str(user.user_id),
            "email": data.username,

        },
        timedelta(days=settings.refreshtime)
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        max_age=60 * 60 * 24 * 7
    )



    return Token(
        access_token=access_token, 
        access_type="Bearer",
        user = UserResponse(
            user_id = user.user_id,
            username = user.username,
            email = user.email,
            major = user.major,
            bio = user.bio,
            profile_pic = user.profile_pic if user.profile_pic and user.profile_pic != "None" else None

            )
        )

@authendpoints.post("/refresh")
def refresh(request:Request,body:RefreshRequest = None):
    try:
        refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token and body:
            refresh_token = body.refresh_token
        elif not refresh_token and not body:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="refresh token missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        

        user = jwt.decode(refresh_token,settings.secret_key,algorithms=[settings.algorithm])

        _id = user.get("sub")
        email = user.get("email")


        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="refresh token not valid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(
            {   "sub": _id,
                "email": email,

            },
            timedelta(minutes=settings.accessexpiretime)
        )

        return Token(access_token=access_token, access_type="Bearer")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    


@authendpoints.get("/google/login")
async def googlelogin(request:Request):
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request,redirect_uri)


@authendpoints.get("/google/callback")
async def google_callback(request:Request,response:Response,session=Depends(get_session)):
    try:
        token = await oauth.google.authorize_access_token(request)
        print(token)
        try:
            user_info = await oauth.google.parse_id_token(request, token)
        except Exception:
            user_info = await oauth.google.userinfo(token=token)
        print("Google user:", user_info)


        query = await session.execute(select(User).where(User.email == user_info["email"]))

        check = query.scalar_one_or_none()

        _id = ""

        if check == None:
            user = User(
                username=user_info["name"],
                email=user_info["email"],
                profile_pic = str(user_info["picture"]),
                login_type = "google"

            )

            session.add(user)

            await session.commit()
            await session.refresh(user)

            _id = user.user_id

        if not _id:
            query = await session.execute(select(User.id).where(User.email == user_info["email"]))
            _id = query.scalar_one_or_none()
            

        access_token = create_access_token(
            {
                "sub":str(_id),
                "email":user_info["email"]
            },
            timedelta(minutes=settings.accessexpiretime)
        )

        refresh_token = create_refresh_token(
            {"sub":str(_id),
             "email":user_info["email"]},
            timedelta(days=settings.refreshtime)
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7
        )

        return Token(
            access_token=access_token,
            access_type="bearer"
        )
    
    

    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Login with Google failed")