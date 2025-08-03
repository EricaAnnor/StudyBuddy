from fastapi import UploadFile,File,APIRouter,Depends,HTTPException,status
from fastapi.responses import FileResponse
from typing import Annotated
from .database import get_session
from fastapi.security import OAuth2PasswordBearer
import os
from .config import Settings
import jwt
import uuid
from uuid import UUID
import aiofiles
from .models import ProfilePicUrl
from enum import Enum

settings = Settings()

file_endpoint = APIRouter(prefix="/studybuddy/v1/files",tags=["File upload endpoints"])

ALLOWED_IMAGES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
}

ALLOWED_DOCS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".zip": "application/zip" 
    
}

class FileType(str,Enum):
    profile_pic = "profile_pic"
    messageimage = "messageimage"
    messagedocument = "messagedocument"


oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")




@file_endpoint.post("/profilepic")
async def upload_picture(file:UploadFile=File(...),token = Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        

        os.makedirs(settings.user_folders,exist_ok=True)

        ext = os.path.splitext(file.filename)[1].lower()

        if ext not in ALLOWED_IMAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image type not acceptable"
            )

        unique_name = f"{uuid.uuid4()}{ext}"

        file_path = os.path.join(settings.user_folders,unique_name)

        chunk_size = 1024 * 1024
        
        async with aiofiles.open(file_path,"wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)

                if not chunk:
                    break

                await buffer.write(chunk)

        url = f"/studybuddy/v1/files/{unique_name}"

        return {
            "url":url
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail = str(e)

        )
    
@file_endpoint.get("/{messagetype}")
async def get_file(
    messagetype: FileType,
    filename: str,
    token=Depends(oauthscheme)
):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )

        # Map file type to directory
        folder_map = {
            FileType.profile_pic: settings.user_folders,
            FileType.messageimage: settings.message_images_folder,
            FileType.messagedocument: settings.message_documents_folder,
        }

        folder = folder_map[messagetype]
        file_path = os.path.join(folder, os.path.basename(filename))

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File does not exist"
            )

        ext = os.path.splitext(filename)[1].lower()
        media_type = (
            ALLOWED_IMAGES.get(ext)
            or ALLOWED_DOCS.get(ext)
            or "application/octet-stream"
        )

        return FileResponse(path=file_path, media_type=media_type, filename=filename)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    

@file_endpoint.post("/message/image")
async def messageimage(images:list[UploadFile] = File(...),token=Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        os.makedirs(settings.message_images_folder,exist_ok=True)

        chunk_size = 1024 * 1024
        result = {"uploaded_files":[],"failed_files":[]}

        for image in images:
            ext = os.path.splitext(image.filename)[1]

            if ext not in ALLOWED_IMAGES:
                result["failed_files"].append({
                    "filename":image.filename,
                    "error": "Image type is not acceptable"
                })
                continue

            filename = f"{uuid.uuid4()}{ext}"

            file_path = os.path.join(settings.message_images_folder,filename)

            async with aiofiles.open(file_path,"wb") as buffer:
                while True:
                    chunk = await image.read(chunk_size)

                    if not chunk:
                        break

                    
                    await buffer.write(chunk)

            url = f"/studybuddy/v1/files/{filename}"
            result["uploaded_files"].append({
                "filename":image.filename,
                "url":url
            })

        return {
            "uploaded_files": result
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail = str(e)

        )
    

@file_endpoint.post("/message/document")
async def messageimage(documents:list[UploadFile] = File(...),token=Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        os.makedirs(settings.message_documents_folder,exist_ok=True)

        chunk_size = 1024 * 1024
        result = {"uploaded_files":[],"failed_files":[]}

        for document in documents:
            ext = os.path.splitext(document.filename)[1]

            if ext not in ALLOWED_DOCS:
                result["failed_files"].append({
                    "filename":document.filename,
                    "error": "Image type is not acceptable"
                })
                continue

            filename = f"{uuid.uuid4()}{ext}"

            file_path = os.path.join(settings.message_documents_folder,filename)

            async with aiofiles.open(file_path,"wb") as buffer:
                while True:
                    chunk = await document.read(chunk_size)

                    if not chunk:
                        break

                    
                    await buffer.write(chunk)

            url = f"/studybuddy/v1/files/{filename}"
            result["uploaded_files"].append({
                "filename":document.filename,
                "url":url
            })

        return {
            "uploaded_files": result
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail = str(e)

        )
        
        



        

    






