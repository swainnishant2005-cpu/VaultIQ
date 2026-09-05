from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file import File
from app.models.folder import Folder
from app.models.share import SharePermission
from app.models.user import User
from app.schemas.share import (
    CreateShareRequest,
    ShareResponse,
    UpdateShareRequest,
)
from app.services.sharing_service import (
    create_file_share,
    create_folder_share,
    delete_share,
    get_share_for_owner,
    list_received_shares,
    update_share_permission,
)
from app.services.storage_service import download_file

router = APIRouter(
    prefix="/api/shares",
    tags=["Sharing"],
)


def share_to_response(share):
    return ShareResponse(
        id=str(share.id),
        file_id=str(share.file_id) if share.file_id else None,
        folder_id=str(share.folder_id) if share.folder_id else None,
        shared_with_user_id=str(share.shared_with_user_id),
        permission=share.permission.value,
        created_at=share.created_at,
        updated_at=share.updated_at,
    )


@router.post("/file/{file_id}", response_model=ShareResponse)
def share_file(
    file_id: str,
    request: CreateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
        user_uuid = UUID(request.shared_with_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID.")

    try:
        share = create_file_share(
            db=db,
            file_id=file_uuid,
            owner_id=current_user.id,
            shared_with_user_id=user_uuid,
            permission=request.permission,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return share_to_response(share)


@router.post("/folder/{folder_id}", response_model=ShareResponse)
def share_folder(
    folder_id: str,
    request: CreateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        folder_uuid = UUID(folder_id)
        user_uuid = UUID(request.shared_with_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID.")

    try:
        share = create_folder_share(
            db=db,
            folder_id=folder_uuid,
            owner_id=current_user.id,
            shared_with_user_id=user_uuid,
            permission=request.permission,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return share_to_response(share)


@router.get("/received")
def get_received_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shares = list_received_shares(db=db, user_id=current_user.id)

    return {
        "shares": [share_to_response(share) for share in shares],
        "total": len(shares),
    }


# =========================================================
# SHARED FILE ACCESS
# =========================================================


def get_shared_file(
    db: Session,
    file_uuid: UUID,
    user_id,
) -> File | None:
    file_record = db.scalar(
        select(File).where(
            File.id == file_uuid,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        return None

    # Owner always has access.
    if file_record.owner_id == user_id:
        return file_record

    # Recipient must have an active share for this file.
    from app.models.share import Share

    share = db.scalar(
        select(Share).where(
            Share.file_id == file_uuid,
            Share.shared_with_user_id == user_id,
        )
    )

    return file_record if share else None


@router.get("/file/{file_id}")
def get_shared_file_details(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID.")

    file_record = get_shared_file(
        db=db,
        file_uuid=file_uuid,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="Shared file not found or you do not have access.",
        )

    from app.models.share import Share

    share = db.scalar(
        select(Share).where(
            Share.file_id == file_uuid,
            Share.shared_with_user_id == current_user.id,
        )
    )

    return {
        "id": str(file_record.id),
        "name": file_record.name,
        "original_name": file_record.original_name,
        "mime_type": file_record.mime_type,
        "size": file_record.size,
        "folder_id": str(file_record.folder_id) if file_record.folder_id else None,
        "permission": share.permission.value if share else "OWNER",
        "shared": share is not None,
    }


@router.get("/file/{file_id}/download")
def download_shared_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID.")

    file_record = get_shared_file(
        db=db,
        file_uuid=file_uuid,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="Shared file not found or you do not have access.",
        )

    try:
        data = download_file(file_record.storage_path)
    except Exception:
        raise HTTPException(status_code=502, detail="Shared file download failed.")

    return Response(
        content=data,
        media_type=file_record.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_record.name}"'
        },
    )


# =========================================================
# SHARE MANAGEMENT
# =========================================================


@router.patch("/{share_id}", response_model=ShareResponse)
def update_share(
    share_id: str,
    request: UpdateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        share_uuid = UUID(share_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid share ID.")

    share = get_share_for_owner(
        db=db,
        share_id=share_uuid,
        owner_id=current_user.id,
    )

    if not share:
        raise HTTPException(status_code=404, detail="Share not found.")

    share = update_share_permission(
        db=db,
        share=share,
        permission=request.permission,
    )

    return share_to_response(share)


@router.delete("/{share_id}")
def remove_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        share_uuid = UUID(share_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid share ID.")

    share = get_share_for_owner(
        db=db,
        share_id=share_uuid,
        owner_id=current_user.id,
    )

    if not share:
        raise HTTPException(status_code=404, detail="Share not found.")

    delete_share(db=db, share=share)

    return {"message": "Share removed successfully."}
