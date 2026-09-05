from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.folder import (
    FolderCreateRequest,
    FolderListResponse,
    FolderResponse,
    FolderUpdateRequest,
)
from app.services.folder_service import (
    create_folder,
    get_folder_by_id,
    list_folders,
    soft_delete_folder,
    update_folder,
)


router = APIRouter(
    prefix="/api/folders",
    tags=["Folders"],
)


def folder_to_response(
    folder,
) -> FolderResponse:
    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
        is_deleted=folder.is_deleted,
        deleted_at=folder.deleted_at,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
    )


# --------------------------------------------------
# CREATE FOLDER
# --------------------------------------------------

@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_folder(
    request: FolderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parent_id = (
            UUID(request.parent_id)
            if request.parent_id
            else None
        )

        folder = create_folder(
            db=db,
            user_id=current_user.id,
            name=request.name,
            parent_id=parent_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return folder_to_response(folder)


# --------------------------------------------------
# LIST FOLDERS
# --------------------------------------------------

@router.get(
    "",
    response_model=FolderListResponse,
)
def get_folders(
    parent_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_parent_id = (
            UUID(parent_id)
            if parent_id
            else None
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid parent folder ID.",
        )

    folders = list_folders(
        db=db,
        user_id=current_user.id,
        parent_id=parsed_parent_id,
    )

    return FolderListResponse(
        folders=[
            folder_to_response(folder)
            for folder in folders
        ],
        total=len(folders),
    )


# --------------------------------------------------
# GET SINGLE FOLDER
# --------------------------------------------------

@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
)
def get_single_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = get_folder_by_id(
        db=db,
        folder_id=folder_id,
        user_id=current_user.id,
    )

    if not folder or folder.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found.",
        )

    return folder_to_response(folder)


# --------------------------------------------------
# UPDATE FOLDER
# --------------------------------------------------

@router.patch(
    "/{folder_id}",
    response_model=FolderResponse,
)
def update_existing_folder(
    folder_id: UUID,
    request: FolderUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = get_folder_by_id(
        db=db,
        folder_id=folder_id,
        user_id=current_user.id,
    )

    if not folder or folder.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found.",
        )

    try:
        parent_id = (
            UUID(request.parent_id)
            if request.parent_id
            else None
        )

        folder = update_folder(
            db=db,
            folder=folder,
            name=request.name,
            parent_id=parent_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return folder_to_response(folder)


# --------------------------------------------------
# DELETE FOLDER
# --------------------------------------------------

@router.delete(
    "/{folder_id}",
    response_model=FolderResponse,
)
def delete_existing_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = get_folder_by_id(
        db=db,
        folder_id=folder_id,
        user_id=current_user.id,
    )

    if not folder or folder.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found.",
        )

    folder = soft_delete_folder(
        db=db,
        folder=folder,
    )

    return folder_to_response(folder)