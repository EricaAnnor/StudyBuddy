from pydantic import BaseModel,model_validator,EmailStr,HttpUrl
from fastapi import HTTPException,status
from typing import Optional,List
from sqlmodel import Field,Column,JSON,SQLModel,Relationship
import uuid
import enum
from datetime import datetime
from sqlalchemy import Index,func
from sqlalchemy import Column

class Login(str,enum.Enum):
    local = "local"
    google = "google"

class Member(str,enum.Enum):
    member = "member"
    admin = "admin"
    owner = "owner"

# Friendship model
class Status(str,enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    blocked = "blocked"


class Friendship(SQLModel, table=True):
    requester: uuid.UUID = Field(foreign_key="user.user_id", primary_key=True)
    receiver: uuid.UUID = Field(foreign_key="user.user_id", primary_key=True)

    status: Status

    requester_relationship: "User" = Relationship(
        back_populates="sent_links",
        sa_relationship_kwargs={"foreign_keys":"Friendship.requester"}
    )
    
    receiver_relationship: "User" = Relationship(
        back_populates="received_links",
        sa_relationship_kwargs={"foreign_keys":"Friendship.receiver"}
    )

    __table_args__ = (
        Index(
            "friendship_unique_pair",
            func.least(Column('requester'), Column('receiver')),
            func.greatest(Column('requester'), Column('receiver')),
            unique=True
        ),
    )


class UserCreate(SQLModel):
    username:str = Field(nullable=False)
    email:EmailStr = Field(unique = True,nullable=False)
    password:str
    major:Optional[str] = None
    bio:Optional[str] = None
    profile_pic:Optional[HttpUrl] = None
    login_type:Optional[Login] = None

    

class GroupMember(SQLModel,table=True):
    user_id:uuid.UUID = Field(foreign_key="user.user_id",primary_key=True)
    group_id:uuid.UUID = Field(foreign_key="groups.group_id",primary_key=True)
    role:Member = Field(default = "member")

    group:"Groups" = Relationship(
        back_populates="user_links"
        )
    user:"User" = Relationship(back_populates="group_links")

DEFAULT_PROFILE_PIC = "https://example.com/default-avatar.png"

class User(SQLModel, table=True):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: EmailStr
    password:str
    major: Optional[str] = None
    bio: Optional[str] = Field(default="hey buddy")
    profile_pic: Optional[str] = Field(default=None)
    login_type:Login 

    #relationship
    group_links:List[GroupMember] = Relationship(back_populates="user")
    sent_links:List[Friendship] = Relationship(back_populates="requester_relationship",
        sa_relationship_kwargs={"foreign_keys":"Friendship.requester"})
    received_links:List[Friendship] = Relationship(back_populates="receiver_relationship",sa_relationship_kwargs={"foreign_keys":"Friendship.receiver"})


class UserResponse(BaseModel):
    user_id:uuid.UUID
    username:str 
    email:EmailStr
    major:Optional[str] = None
    bio:Optional[str] = None
    profile_pic:Optional[str] = None

    class Config:
        orm_mode = True

class UserLogin(SQLModel):
    email:EmailStr
    password:str

   

class Token(BaseModel):
    access_token:str
    access_type:str
    user:Optional[UserResponse] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class UserUpdate(BaseModel):
    username:Optional[str] = None
    email:Optional[EmailStr] = None
    major:Optional[str] = None
    bio:Optional[str]  = None
    profile_pic:Optional[str] = None


#group model
class GroupBase(SQLModel):
    group_name:str
    description:Optional[str] = None
    
class GroupCreate(GroupBase):
    profile_pic:Optional[HttpUrl] = None
    members:List[uuid.UUID]


class Groups(GroupBase,table=True):
    group_id:uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    profile_pic:Optional[str] = None
    owner:uuid.UUID

    #relationships
    user_links:List[GroupMember] = Relationship(back_populates="group")

class GroupUpdate(BaseModel):
    group_id:uuid.UUID
    group_name:Optional[str] = None
    description:Optional[str] = None
    profile_pic:Optional[HttpUrl] = None

class GroupDelete(BaseModel):
    group_id:uuid.UUID

class GroupMemeberUpdate(BaseModel):
    group_id:uuid.UUID
    members:List[uuid.UUID] # check this 
    
class GroupResponse(GroupBase):
    group_id:uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    profile_pic:Optional[str] = None
    owner:uuid.UUID

    class Config:
        orm_mode = True



class MessageType(str,enum.Enum):
    one_on_one = "one_on_one"
    group = "group"


class SendMessage(BaseModel):
    messagetype:MessageType
    message:Optional[str] = None
    attachments:Optional[List[str]] = []
    user_id:Optional[uuid.UUID] = None
    group_id:Optional[uuid.UUID] = None

    @model_validator(mode="after")
    def checktype(self)->"SendMessage":
        if not self.user_id and not self.group_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Specify either the user_id or group_id"
            )

        return self
    


class Friend_Payload(BaseModel):
    friend_id:uuid.UUID

class UpdateFriendRequest(Friend_Payload):
    status:Status

class Friends_Response(BaseModel):
    friends:List[UserResponse]

    class Config:
        orm_mode = True


class UserSettings(SQLModel,table=True):
    user_id:uuid.UUID = Field(foreign_key="user.user_id", primary_key = True)
    allow_notifications:bool = Field(default=True)
    allow_messages_if_in_the_same_group:bool = Field(default=True)

class UserSettingsBody(BaseModel):
    allow_notifications:Optional[bool] = None
    allow_messages_if_in_the_same_group:Optional[bool] = None


class ProfilePicUrl(BaseModel):
    url:HttpUrl

class GetPresence(BaseModel):
    user_id:uuid.UUID

class GetPresencePesponse(BaseModel):
    online:bool
    time:int
    user_id: uuid.UUID

class FriendFormat(str,enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    blocked = "blocked"
    not_friend = "not_friend"


class AllUser(UserResponse):
    isFriend:FriendFormat
    isFriendRequest:bool

class AllUsers(BaseModel):
    users:List[AllUser]