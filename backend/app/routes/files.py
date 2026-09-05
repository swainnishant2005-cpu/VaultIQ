import uuid
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.supabase import supabase
from app.models.file import File
from app.models.user import User
from app.schemas.file import (
    FileListResponse,
    FileResponse,
)
from app.services.file_service import (
    create_file_record,
    get_file_by_id,
    list_file_versions,
    list_files,
    move_file,
    rename_file,
    restore_file,
    soft_delete_file,
    validate_folder,
)
from app.services.storage_service import (
    delete_file as delete_storage_file,
    download_file,
)


router = APIRouter(
    prefix="/api/files",
    tags=["Files"],
)


def file_to_response(
    file_record: File,
) -> FileResponse:
    return FileResponse(
        id=str(file_record.id),
        name=file_record.name,
        original_name=file_record.original_name,
        mime_type=file_record.mime_type,
        size=file_record.size,
        storage_path=file_record.storage_path,
        owner_id=str(file_record.owner_id),
        folder_id=(
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        is_deleted=file_record.is_deleted,
        deleted_at=file_record.deleted_at,
        created_at=file_record.created_at,
        updated_at=file_record.updated_at,
    )


# ==================================================
# STORAGE QUOTA
# ==================================================

FREE_STORAGE_BYTES = 5 * 1024 * 1024 * 1024


def get_storage_usage(db: Session, user_id: UUID) -> int:
    total = db.scalar(
        select(func.coalesce(func.sum(File.size), 0))
        .where(
            File.owner_id == user_id,
            File.is_deleted.is_(False),
        )
    )
    return int(total or 0)


@router.get("/storage/usage")
def storage_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    used_bytes = get_storage_usage(db, current_user.id)
    available_bytes = max(FREE_STORAGE_BYTES - used_bytes, 0)
    percentage = min((used_bytes / FREE_STORAGE_BYTES) * 100, 100)

    return {
        "plan": "Free",
        "used_bytes": used_bytes,
        "limit_bytes": FREE_STORAGE_BYTES,
        "available_bytes": available_bytes,
        "percentage": round(percentage, 2),
    }


# ==================================================
# UPLOAD FILE
# ==================================================

@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    folder_id: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A file is required.",
        )

    try:
        parsed_folder_id = (
            UUID(folder_id.strip())
            if folder_id and folder_id.strip()
            else None
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid folder ID.",
        )

    try:
        validate_folder(
            db=db,
            folder_id=parsed_folder_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    file_data = await file.read()

    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Cannot upload an empty file.",
        )

    file_size = len(file_data)

    used_bytes = get_storage_usage(db, current_user.id)
    if used_bytes + file_size > FREE_STORAGE_BYTES:
        available_bytes = max(FREE_STORAGE_BYTES - used_bytes, 0)
        raise HTTPException(
            status_code=413,
            detail=(
                f"Storage limit exceeded. You have "
                f"{available_bytes / (1024 * 1024):.2f} MB available "
                f"on the Free plan."
            ),
        )

    mime_type = (
        file.content_type
        or "application/octet-stream"
    )

    file_id = uuid.uuid4()

    safe_filename = (
        file.filename
        .replace("/", "_")
        .replace("\\", "_")
    )

    storage_path = (
        f"{current_user.id}/"
        f"{file_id}/"
        f"{safe_filename}"
    )

    try:
        supabase.storage.from_(
            settings.SUPABASE_STORAGE_BUCKET
        ).upload(
            path=storage_path,
            file=file_data,
            file_options={
                "content-type": mime_type,
                "upsert": False,
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Storage upload failed: {str(exc)}",
        )

    try:
        file_record = create_file_record(
            db=db,
            user_id=current_user.id,
            folder_id=parsed_folder_id,
            name=file.filename,
            original_name=file.filename,
            mime_type=mime_type,
            size=file_size,
            storage_path=storage_path,
        )
    except Exception:
        try:
            supabase.storage.from_(
                settings.SUPABASE_STORAGE_BUCKET
            ).remove([storage_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="File metadata creation failed.",
        )

    return file_to_response(file_record)


# ==================================================
# DOWNLOAD FILE
# ==================================================

@router.get(
    "/{file_id}/download",
)
def download_single_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    try:
        file_data = download_file(
            file_record.storage_path
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="File download failed.",
        )

    return Response(
        content=file_data,
        media_type=file_record.mime_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{file_record.name}"'
            )
        },
    )


# ==================================================
# GET SINGLE FILE
# ==================================================

@router.get(
    "/{file_id}",
    response_model=FileResponse,
)
def get_single_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    return file_to_response(file_record)


# ==================================================
# RENAME FILE
# ==================================================

@router.patch(
    "/{file_id}/rename",
    response_model=FileResponse,
)
def rename_single_file(
    file_id: str,
    new_name: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    try:
        file_record = rename_file(
            db=db,
            file_record=file_record,
            new_name=new_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return file_to_response(file_record)


# ==================================================
# MOVE FILE
# ==================================================

@router.patch(
    "/{file_id}/move",
    response_model=FileResponse,
)
def move_single_file(
    file_id: str,
    folder_id: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    try:
        parsed_folder_id = (
            UUID(folder_id.strip())
            if folder_id and folder_id.strip()
            else None
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid folder ID.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    try:
        file_record = move_file(
            db=db,
            file_record=file_record,
            folder_id=parsed_folder_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return file_to_response(file_record)


# ==================================================
# SOFT DELETE FILE
# ==================================================

@router.delete(
    "/{file_id}",
    response_model=FileResponse,
)
def delete_single_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    file_record = soft_delete_file(
        db=db,
        file_record=file_record,
    )

    return file_to_response(file_record)


# ==================================================
# RESTORE FILE
# ==================================================

@router.post(
    "/{file_id}/restore",
    response_model=FileResponse,
)
def restore_single_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    statement_file = get_file_by_id(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if statement_file:
        raise HTTPException(
            status_code=400,
            detail="File is already active.",
        )

    from app.services.file_service import (
        get_file_including_deleted,
    )

    file_record = get_file_including_deleted(
        db=db,
        file_id=parsed_file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    file_record = restore_file(
        db=db,
        file_record=file_record,
    )

    return file_to_response(file_record)


# ==================================================
# LIST FILE VERSIONS
# ==================================================

@router.get(
    "/{file_id}/versions",
)
def get_file_versions(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_file_id = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    try:
        versions = list_file_versions(
            db=db,
            file_id=parsed_file_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    return {
        "versions": [
            {
                "id": str(version.id),
                "file_id": str(version.file_id),
                "version_number": version.version_number,
                "storage_path": version.storage_path,
                "size": version.size,
                "mime_type": version.mime_type,
                "created_by": str(version.created_by),
                "created_at": version.created_at,
            }
            for version in versions
        ],
        "total": len(versions),
    }


# ==================================================
# LIST FILES
# ==================================================

@router.get(
    "",
    response_model=FileListResponse,
)
def get_files(
    folder_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_folder_id = (
            UUID(folder_id.strip())
            if folder_id and folder_id.strip()
            else None
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid folder ID.",
        )

    try:
        validate_folder(
            db=db,
            folder_id=parsed_folder_id,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    files = list_files(
        db=db,
        user_id=current_user.id,
        folder_id=parsed_folder_id,
    )

    return FileListResponse(
        files=[
            file_to_response(file_record)
            for file_record in files
        ],
        total=len(files),
    )