from fastapi import APIRouter,Depends,HTTPException,status
from .database import get_session
from fastapi.security import OAuth2PasswordBearer
import jwt
from .models import GroupCreate,GroupMemeberUpdate,Groups,GroupUpdate,GroupResponse,GroupDelete,User,GroupMember
from .config import Settings
from sqlmodel import select
from uuid import UUID
from sqlalchemy import asc

settings = Settings()

groupmanage = APIRouter(prefix="/studybuddy/v1",tags=["Group managgement endpoints"])

oauthscheme = OAuth2PasswordBearer(tokenUrl="/studybuddy/v1/login")



@groupmanage.post("/group",response_model = GroupResponse)
async def create_group(data:GroupCreate,session=Depends(get_session),token = Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail = "User is not authenticated"
            )
        
        group = Groups(
            group_name = data.group_name,
            # members = [str(member) for member in data.members],
            profile_pic = str(data.profile_pic),
            owner = _id,
            description = data.description,
        )

        session.add(group)
        await session.flush()

        owner = GroupMember(
            user_id=_id,
            group_id = group.group_id,
            role = "owner"
        )

        session.add(owner)
        added = []
        #work on the added and not_added later
        not_added = []
        count = 1 
        for member in data.members:
            try:
                user_check = await session.execute(select(User).where(User.user_id == member))
                user = user_check.scalar_one_or_none()

                if user is None:
                    not_added.append(
                        {
                            "user":member,
                            "error": "User does not exist"
                        }
                    )

                    continue
                

                link = await session.execute(select(GroupMember).where(
                    (GroupMember.user_id == member) & 
                    (GroupMember.group_id == group.group_id))
                    )
                check = link.scalar_one_or_none()

                if check != None:
                    continue
                
                entry = GroupMember(
                    user_id=member,
                    group_id = group.group_id
                )
                if count >= settings.maxgroupcapacity:
                    continue
                session.add(entry)
                added.append(member)
                count += 1
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Error creating user {member}:{str(e)}"
                )
        

        await session.commit()
        await session.refresh(group)

        return group
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@groupmanage.patch("/group/update",response_model = GroupResponse)
async def updategroup(data:GroupUpdate,session=Depends(get_session),token=Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
                )
        
        query = await session.execute(select(Groups).where(Groups.group_id == data.group_id))
        group = query.scalar_one_or_none()

        if group is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail = "Group not found"
            )
        
        owner_or_member_check  = await session.execute(select(GroupMember).where((GroupMember.group_id == data.group_id) & (GroupMember.user_id == _id)))

        ans = owner_or_member_check.scalar_one_or_none()

        if ans is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = "User is not a member of the group"
            )

        for atr,field in data.model_dump(exclude_unset=True).items():
            if atr == "profile_pic":
                field = str(field)
            setattr(group,atr,field)

        session.add(group)
        await session.commit()
        await session.refresh(group)

        return group
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@groupmanage.delete("/group/delete")
async def delete_group(data:GroupDelete,session=Depends(get_session),token = Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
                )
        
        query = await session.execute(select(Groups).where(Groups.group_id == data.group_id))

        group = query.scalar_one_or_none()

        if group is not None:

            owner_or_member_check  = await session.execute(select(GroupMember).where((GroupMember.group_id == data.group_id) & (GroupMember.user_id == _id)))

            ans = owner_or_member_check.scalar_one_or_none()

    
            if ans is None or ans.role != "owner":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail = "User is not eligible to delete the group"
                )
            
            await session.delete(group)
            await session.commit()

            return {"detail":"Group has successfully been deleted"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail = "Group does not exist"
            )
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@groupmanage.patch("/group/addmember")
async def add_group_member(data:GroupMemeberUpdate,session = Depends(get_session),token = Depends(oauthscheme)):
    try:
        payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
                )
        
        query = await session.execute(select(Groups).where(Groups.group_id == data.group_id))



        group = query.scalar_one_or_none()
        # checking if group exists
        if group is not None:

            owner_or_member_check  = await session.execute(select(GroupMember).where((GroupMember.group_id == data.group_id) & (GroupMember.user_id == _id)))

            ans = owner_or_member_check.scalar_one_or_none()
            if ans is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is not a member of the group"
                )

            count_query = await session.execute(select(GroupMember).where(GroupMember.group_id == data.group_id))
            count_ans = count_query.scalars().all()

            count = len(count_ans)

            if count >= settings.maxgroupcapacity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail = "Group is full"
                )

            accepted = []
            rejected = []

            for user in data.members:
                try:
                    cur_ = await session.execute(select(User).where(User.user_id == user))

                    cur = cur_.scalar_one_or_none()

                    if cur is None: 
                        rejected.append({
                            "user_id": str(user),
                            "error": str("User does not exist")
                        })
                        continue
                   

                    chec = await session.execute(select(GroupMember).where((GroupMember.user_id == user) & (GroupMember.group_id == data.group_id)))
                    check = chec.scalar_one_or_none()

                    if check is not None:
                        rejected.append({
                            "user_id": str(user),
                            "error": str("User is already in the group")
                        })
                        continue
                    
                    
                    if count >= settings.maxgroupcapacity:
                        rejected.append({
                            "user_id": str(user),
                            "error": str("Group is full")
                        })
                        continue
                    
                    add_member = GroupMember(
                        user_id=user,
                        group_id=data.group_id
                    )

                    session.add(add_member)
                    accepted.append(str(user))
                    count += 1


                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error creating user {user}:{str(e)}"
                    )

            await session.commit()

            return {
                "detail": "Members successfully added",
                "accepted":accepted,
                "rejected": rejected
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail = "Group does not exist"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail = "User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@groupmanage.delete("/group/deletemember")
async def deletemember(data: GroupMemeberUpdate, session=Depends(get_session), token=Depends(oauthscheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        _id = UUID(payload["sub"])

        if not _id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )

        # Check if group exists
        query = await session.execute(select(Groups).where(Groups.group_id == data.group_id))
        group = query.scalar_one_or_none()

        if group is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )

        # Check if user is owner of the group
        if _id != group.owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can remove members"
            )

        removed = []
        not_found = []

        for member_id in data.members:
            try:
                stmt = select(GroupMember).where(
                    GroupMember.group_id == data.group_id,
                    GroupMember.user_id == member_id
                )
                result = await session.execute(stmt)
                member = result.scalar_one_or_none()

                if member:
                    await session.delete(member)
                    removed.append(str(member_id))
                else:
                    not_found.append(str(member_id))
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=str(e)
                )

        await session.commit()

        return {
            "detail": "Processed member removal",
            "removed": removed,
            "not_found": not_found
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="User not authenticated. Kindly login again")
    except Exception as e:
        await session.rollback()  # Rollback on any other error
        print(f"Error removing friend: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@groupmanage.get("/groupmembers")
async def getgroupmembers(session = Depends(get_session), token = Depends(oauthscheme)):
    
    payload = jwt.decode(token,settings.secret_key,algorithms=[settings.algorithm])

    _id = UUID(payload["sub"])

    if not _id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User is not authenticated")
    
    grp_query = await session.execute(select(GroupMember.group_id).where(GroupMember.user_id == _id))
    grp_res = grp_query.scalars().all()

    res = []

    res_query = await session.execute(select(Groups).where(Groups.group_id.in_(grp_res)).order_by(asc(Groups.group_name)))
    res = res_query.scalars().all()
    

    return {
        "user_groups": res
    }



