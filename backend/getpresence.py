from .redis import redis  
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from .models import GetPresencePesponse
import jwt
from .config import Settings
from uuid import UUID

settings = Settings()
checkpresence = APIRouter(prefix="/studybuddy/v1/checkpresence", tags=["online"])
oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")


@checkpresence.get("/{userid}")
async def checkstatus(userid: UUID, token: str = Depends(oauthscheme)):

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorised"
        )

    userid = str(userid)

    check = await redis.exists(f"user:{userid}")

    cur = None
    if check:
        cur = await redis.get(f"user:{userid}")

    lastseen = 0
    check2 = await redis.exists(f"user:{userid}:lastseen")
    if check2:
        lastseen_val = await redis.get(f"user:{userid}:lastseen")
        if lastseen_val:
            try:
                lastseen = int(lastseen_val.decode() if isinstance(lastseen_val, bytes) else lastseen_val)
            except Exception:
                lastseen = 0

    return GetPresencePesponse(
        online=True if check else False,
        time=lastseen,
        user_id=UUID(userid)
    )
