import uuid

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder


def search_files(
    db: Session,
    *,
    user_id: uuid.UUID,
    query: str,
    mime_type: str | None = None,
) -> list[File]:
    statement = (
        select(File)
        .where(
            File.owner_id == user_id,
            File.is_deleted.is_(False),
            or_(
                File.name.ilike(f"%{query}%"),
                File.original_name.ilike(
                    f"%{query}%"
                ),
            ),
        )
        .order_by(
            File.created_at.desc()
        )
    )

    if mime_type:
        statement = statement.where(
            File.mime_type == mime_type
        )

    return list(
        db.scalars(statement).all()
    )


def search_folders(
    db: Session,
    *,
    user_id: uuid.UUID,
    query: str,
) -> list[Folder]:
    statement = (
        select(Folder)
        .where(
            Folder.owner_id == user_id,
            Folder.is_deleted.is_(False),
            Folder.name.ilike(
                f"%{query}%"
            ),
        )
        .order_by(
            Folder.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )