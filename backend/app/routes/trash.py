from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.activity_service import create_activity
from app.models.activity import ActivityAction
from app.services.storage_service import delete_file
from app.services.trash_service import (
    get_deleted_file,
    list_deleted_files,
    permanently_delete_file,
    restore_deleted_file,
)


router = APIRouter(
    prefix="/api/trash",
    tags=["Trash"],
)


def file_response(file_record):
    return {
        "id": str(file_record.id),
        "name": file_record.name,
        "original_name": file_record.original_name,
        "mime_type": file_record.mime_type,
        "size": file_record.size,
        "storage_path": file_record.storage_path,
        "owner_id": str(file_record.owner_id),
        "folder_id": (
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        "is_deleted": file_record.is_deleted,
        "deleted_at": file_record.deleted_at,
        "created_at": file_record.created_at,
        "updated_at": file_record.updated_at,
    }


@router.get("")
def get_trash(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = list_deleted_files(
        db=db,
        user_id=current_user.id,
    )

    return {
        "files": [
            file_response(file_record)
            for file_record in files
        ],
        "total": len(files),
    }


@router.post(
    "/{file_id}/restore",
)
def restore_from_trash(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_deleted_file(
        db=db,
        file_id=file_uuid,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="Deleted file not found.",
        )

    file_record = restore_deleted_file(
        db=db,
        file_record=file_record,
    )

    create_activity(
        db=db,
        user_id=current_user.id,
        action=ActivityAction.RESTORE,
        file_id=file_uuid,
    )

    return file_response(file_record)


@router.delete(
    "/{file_id}/permanent",
)
def permanently_delete(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_deleted_file(
        db=db,
        file_id=file_uuid,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="Deleted file not found.",
        )

    storage_path = file_record.storage_path

    try:
        delete_file(storage_path)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Storage deletion failed.",
        )

    permanently_delete_file(
        db=db,
        file_record=file_record,
    )

    create_activity(
        db=db,
        user_id=current_user.id,
        action=ActivityAction.DELETE,
        file_id=file_uuid,
        extra_data={
            "permanent": True,
        },
    )

    return {
        "message": "File permanently deleted."
    }