import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.file_version import FileVersion


def get_next_version_number(
    db: Session,
    file_id: uuid.UUID,
) -> int:
    statement = (
        select(FileVersion.version_number)
        .where(
            FileVersion.file_id == file_id
        )
        .order_by(
            FileVersion.version_number.desc()
        )
    )

    latest = db.scalar(statement)

    return 1 if latest is None else latest + 1


def get_version(
    db: Session,
    version_id: uuid.UUID,
    user_id: uuid.UUID,
) -> FileVersion | None:
    statement = (
        select(FileVersion)
        .join(File)
        .where(
            FileVersion.id == version_id,
            File.owner_id == user_id,
        )
    )

    return db.scalar(statement)


def list_versions(
    db: Session,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[FileVersion]:
    file_statement = select(File).where(
        File.id == file_id,
        File.owner_id == user_id,
    )

    file_record = db.scalar(file_statement)

    if not file_record:
        raise ValueError("File not found.")

    statement = (
        select(FileVersion)
        .where(
            FileVersion.file_id == file_id
        )
        .order_by(
            FileVersion.version_number.asc()
        )
    )

    return list(db.scalars(statement).all())


def create_version(
    db: Session,
    *,
    file_record: File,
    storage_path: str,
    size: int,
    mime_type: str,
    created_by: uuid.UUID,
) -> FileVersion:
    version_number = get_next_version_number(
        db,
        file_record.id,
    )

    version = FileVersion(
        file_id=file_record.id,
        version_number=version_number,
        storage_path=storage_path,
        size=size,
        mime_type=mime_type,
        created_by=created_by,
    )

    db.add(version)

    # The File record represents the current version.
    file_record.storage_path = storage_path
    file_record.size = size
    file_record.mime_type = mime_type

    db.commit()
    db.refresh(version)
    db.refresh(file_record)

    return version


def restore_version_metadata(
    db: Session,
    file_record: File,
    version: FileVersion,
) -> File:
    file_record.storage_path = version.storage_path
    file_record.size = version.size
    file_record.mime_type = version.mime_type

    db.commit()
    db.refresh(file_record)

    return file_record