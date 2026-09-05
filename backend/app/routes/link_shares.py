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
from app.schemas.link_share import (
    CreateLinkShareRequest,
    LinkAccessRequest,
)
from app.services.link_share_service import (
    create_link_share,
    get_active_link,
    list_owner_links,
    revoke_link,
    verify_link_password,
)
from app.services.storage_service import download_file
from app.services.file_service import get_file_by_id
from fastapi.responses import Response


router = APIRouter(
    prefix="/api/link-shares",
    tags=["Link Sharing"],
)


def link_to_response(link):
    return {
        "id": str(link.id),
        "file_id": (
            str(link.file_id)
            if link.file_id
            else None
        ),
        "folder_id": (
            str(link.folder_id)
            if link.folder_id
            else None
        ),
        "token": link.token,
        "expires_at": link.expires_at,
        "is_active": link.is_active,
        "created_by": str(link.created_by),
        "created_at": link.created_at,
    }


@router.post("")
def create_link(
    request: CreateLinkShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_id = (
            UUID(request.file_id)
            if request.file_id
            else None
        )

        folder_id = (
            UUID(request.folder_id)
            if request.folder_id
            else None
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID.",
        )

    try:
        link = create_link_share(
            db=db,
            owner_id=current_user.id,
            file_id=file_id,
            folder_id=folder_id,
            password=request.password,
            expires_at=request.expires_at,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return link_to_response(link)


@router.get("")
def get_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    links = list_owner_links(
        db=db,
        owner_id=current_user.id,
    )

    return {
        "links": [
            link_to_response(link)
            for link in links
        ],
        "total": len(links),
    }


@router.post("/{token}/access")
def access_link(
    token: str,
    request: LinkAccessRequest,
    db: Session = Depends(get_db),
):
    link = get_active_link(
        db=db,
        token=token,
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Link not found or expired.",
        )

    if not verify_link_password(
        link,
        request.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid link password.",
        )

    if link.file_id:
        from app.models.file import File

        from sqlalchemy import select

        file_record = db.scalar(
            select(File).where(
                File.id == link.file_id,
                File.is_deleted.is_(False),
            )
        )

        if not file_record:
            raise HTTPException(
                status_code=404,
                detail="Shared file not found.",
            )

        return {
            "type": "file",
            "id": str(file_record.id),
            "name": file_record.name,
            "mime_type": file_record.mime_type,
            "size": file_record.size,
        }

    from app.models.folder import Folder

    from sqlalchemy import select

    folder = db.scalar(
        select(Folder).where(
            Folder.id == link.folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=404,
            detail="Shared folder not found.",
        )

    return {
        "type": "folder",
        "id": str(folder.id),
        "name": folder.name,
    }


@router.get("/{token}/download")
def download_link(
    token: str,
    db: Session = Depends(get_db),
):
    link = get_active_link(
        db=db,
        token=token,
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Link not found or expired.",
        )

    if not link.file_id:
        raise HTTPException(
            status_code=400,
            detail="This link does not point to a file.",
        )

    from app.models.file import File
    from sqlalchemy import select

    file_record = db.scalar(
        select(File).where(
            File.id == link.file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="Shared file not found.",
        )

    try:
        data = download_file(
            file_record.storage_path
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Shared file download failed.",
        )

    return Response(
        content=data,
        media_type=file_record.mime_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="'
                f'{file_record.name}"'
            )
        },
    )


@router.delete("/{link_id}")
def revoke_link_share(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        link_uuid = UUID(link_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid link ID.",
        )

    from sqlalchemy import select
    from app.models.link_share import LinkShare

    link = db.scalar(
        select(LinkShare).where(
            LinkShare.id == link_uuid
        )
    )

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Link not found.",
        )

    try:
        revoke_link(
            db=db,
            share=link,
            owner_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )

    return {
        "message": "Link revoked successfully."
    }