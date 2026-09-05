import uuid
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.supabase import supabase
from app.models.user import User
from app.schemas.file import FileResponse
from app.schemas.version import FileVersionResponse
from app.services.file_service import (
    get_file_by_id,
)
from app.services.storage_service import (
    download_file,
)
from app.services.version_service import (
    create_version,
    get_version,
    list_versions,
    restore_version_metadata,
)


router = APIRouter(
    prefix="/api/files",
    tags=["File Versions"],
)


def version_to_response(version):
    return FileVersionResponse(
        id=str(version.id),
        file_id=str(version.file_id),
        version_number=version.version_number,
        storage_path=version.storage_path,
        size=version.size,
        mime_type=version.mime_type,
        created_by=str(version.created_by),
        created_at=version.created_at,
    )


@router.post(
    "/{file_id}/versions",
    response_model=FileVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_new_version(
    file_id: str,
    file: UploadFile = FastAPIFile(...),
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

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A file is required.",
        )

    file_data = await file.read()

    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Cannot upload an empty file.",
        )

    mime_type = (
        file.content_type
        or "application/octet-stream"
    )

    from app.services.version_service import (
        get_next_version_number,
    )

    next_version = get_next_version_number(
        db,
        parsed_file_id,
    )

    safe_filename = (
        file.filename
        .replace("/", "_")
        .replace("\\", "_")
    )

    storage_path = (
        f"{current_user.id}/"
        f"{parsed_file_id}/"
        f"versions/"
        f"v{next_version}/"
        f"{safe_filename}"
    )

    try:
        supabase.storage.from_(
            __import__(
                "app.core.config",
                fromlist=["settings"],
            ).settings.SUPABASE_STORAGE_BUCKET
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
        version = create_version(
            db=db,
            file_record=file_record,
            storage_path=storage_path,
            size=len(file_data),
            mime_type=mime_type,
            created_by=current_user.id,
        )
    except Exception:
        try:
            supabase.storage.from_(
                __import__(
                    "app.core.config",
                    fromlist=["settings"],
                ).settings.SUPABASE_STORAGE_BUCKET
            ).remove([storage_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="Version metadata creation failed.",
        )

    return version_to_response(version)


@router.get(
    "/{file_id}/versions",
)
def get_versions(
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
        versions = list_versions(
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
            version_to_response(version)
            for version in versions
        ],
        "total": len(versions),
    }


@router.get(
    "/versions/{version_id}/download",
)
def download_version(
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_version_id = UUID(version_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid version ID.",
        )

    version = get_version(
        db=db,
        version_id=parsed_version_id,
        user_id=current_user.id,
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Version not found.",
        )

    try:
        data = download_file(
            version.storage_path
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Version download failed.",
        )

    return Response(
        content=data,
        media_type=version.mime_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="'
                f'file-v{version.version_number}"'
            )
        },
    )


@router.post(
    "/versions/{version_id}/restore",
    response_model=FileResponse,
)
def restore_version(
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_version_id = UUID(version_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid version ID.",
        )

    version = get_version(
        db=db,
        version_id=parsed_version_id,
        user_id=current_user.id,
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Version not found.",
        )

    file_record = get_file_by_id(
        db=db,
        file_id=version.file_id,
        user_id=current_user.id,
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found.",
        )

    file_record = restore_version_metadata(
        db=db,
        file_record=file_record,
        version=version,
    )

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