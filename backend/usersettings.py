from fastapi import APIRouter,Depends,HTTPException,status
from .models import UserSettings,UserSettingsBody,User
from fastapi.security import OAuth2PasswordBearer
from .database import get_session
import jwt
from .config import Settings
from uuid import UUID
from sqlmodel import select

settings  = Settings()

Oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")

user_setting  = APIRouter(prefix="/studybuddy/v1/chat", tags=["User settings endpoint"])


@user_setting.patch("/change/settings")
async def change_user_settings(data:UserSettingsBody,session=Depends(get_session),token=Depends(Oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        user_query = await session.execute(select(UserSettings).where(UserSettings.user_id ==_id))

        user = user_query.scalar_one_or_none()

        if not user:
            user = UserSettings(user_id=_id)
            session.add(user)
        
        for atr,field in data.model_dump(exclude_unset=True).items():
            setattr(user,atr,field)

        session.add(user)
        await session.commit()

        return {
            "message":"User settings changed successfully"
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(e)
        raise HTTPException(status_code=500, detail=f"Internal server error {e}")


