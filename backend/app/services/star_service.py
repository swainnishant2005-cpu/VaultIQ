import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.star import Star


def star_file(
    db: Session,
    *,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Star:
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == user_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise ValueError("File not found.")

    existing = db.scalar(
        select(Star).where(
            Star.user_id == user_id,
            Star.file_id == file_id,
        )
    )

    if existing:
        raise ValueError(
            "File is already starred."
        )

    star = Star(
        user_id=user_id,
        file_id=file_id,
        folder_id=None,
    )

    db.add(star)
    db.commit()
    db.refresh(star)

    return star


def star_folder(
    db: Session,
    *,
    folder_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Star:
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.owner_id == user_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise ValueError(
            "Folder not found."
        )

    existing = db.scalar(
        select(Star).where(
            Star.user_id == user_id,
            Star.folder_id == folder_id,
        )
    )

    if existing:
        raise ValueError(
            "Folder is already starred."
        )

    star = Star(
        user_id=user_id,
        file_id=None,
        folder_id=folder_id,
    )

    db.add(star)
    db.commit()
    db.refresh(star)

    return star


def list_starred(
    db: Session,
    user_id: uuid.UUID,
) -> list[Star]:
    statement = (
        select(Star)
        .where(
            Star.user_id == user_id
        )
        .order_by(
            Star.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_user_star(
    db: Session,
    *,
    star_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Star | None:
    return db.scalar(
        select(Star).where(
            Star.id == star_id,
            Star.user_id == user_id,
        )
    )


def unstar(
    db: Session,
    star: Star,
) -> None:
    db.delete(star)
    db.commit()