from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.file_version import FileVersion
from app.models.folder import Folder


def get_file_by_id(
    db: Session,
    file_id: UUID,
    user_id: UUID,
) -> File | None:
    """
    Return an active file belonging to the current user.
    """

    statement = select(File).where(
        File.id == file_id,
        File.owner_id == user_id,
        File.is_deleted.is_(False),
    )

    return db.scalar(statement)


def get_file_including_deleted(
    db: Session,
    file_id: UUID,
    user_id: UUID,
) -> File | None:
    """
    Return a file belonging to the current user,
    including soft-deleted files.
    """

    statement = select(File).where(
        File.id == file_id,
        File.owner_id == user_id,
    )

    return db.scalar(statement)


def validate_folder(
    db: Session,
    folder_id: UUID | None,
    user_id: UUID,
) -> Folder | None:
    """
    Validate that a folder belongs to the current user.
    """

    if folder_id is None:
        return None

    statement = select(Folder).where(
        Folder.id == folder_id,
        Folder.owner_id == user_id,
        Folder.is_deleted.is_(False),
    )

    folder = db.scalar(statement)

    if not folder:
        raise ValueError(
            "Destination folder not found."
        )

    return folder


def get_next_version_number(
    db: Session,
    file_id: UUID,
) -> int:
    """
    Get the next version number for a file.
    """

    statement = (
        select(FileVersion.version_number)
        .where(FileVersion.file_id == file_id)
        .order_by(
            FileVersion.version_number.desc()
        )
    )

    latest_version = db.scalar(statement)

    if latest_version is None:
        return 1

    return latest_version + 1


def create_file_record(
    db: Session,
    *,
    user_id: UUID,
    folder_id: UUID | None,
    name: str,
    original_name: str,
    mime_type: str,
    size: int,
    storage_path: str,
) -> File:
    """
    Create the file metadata and first version.
    """

    file_record = File(
        name=name,
        original_name=original_name,
        mime_type=mime_type,
        size=size,
        storage_path=storage_path,
        owner_id=user_id,
        folder_id=folder_id,
    )

    db.add(file_record)
    db.flush()

    version = FileVersion(
        file_id=file_record.id,
        version_number=1,
        storage_path=storage_path,
        size=size,
        mime_type=mime_type,
        created_by=user_id,
    )

    db.add(version)

    db.commit()
    db.refresh(file_record)

    return file_record


def list_files(
    db: Session,
    user_id: UUID,
    folder_id: UUID | None = None,
) -> list[File]:
    """
    List active files belonging to the current user.
    """

    statement = (
        select(File)
        .where(
            File.owner_id == user_id,
            File.folder_id == folder_id,
            File.is_deleted.is_(False),
        )
        .order_by(File.name.asc())
    )

    return list(
        db.scalars(statement).all()
    )


def rename_file(
    db: Session,
    file_record: File,
    new_name: str,
) -> File:
    """
    Rename a file.
    """

    new_name = new_name.strip()

    if not new_name:
        raise ValueError(
            "File name cannot be empty."
        )

    file_record.name = new_name

    db.commit()
    db.refresh(file_record)

    return file_record


def move_file(
    db: Session,
    file_record: File,
    folder_id: UUID | None,
) -> File:
    """
    Move a file to another folder.
    """

    validate_folder(
        db,
        folder_id,
        file_record.owner_id,
    )

    file_record.folder_id = folder_id

    db.commit()
    db.refresh(file_record)

    return file_record


def soft_delete_file(
    db: Session,
    file_record: File,
) -> File:
    """
    Soft-delete a file.
    """

    file_record.is_deleted = True
    file_record.deleted_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(file_record)

    return file_record


def restore_file(
    db: Session,
    file_record: File,
) -> File:
    """
    Restore a soft-deleted file.
    """

    file_record.is_deleted = False
    file_record.deleted_at = None

    db.commit()
    db.refresh(file_record)

    return file_record


def list_file_versions(
    db: Session,
    file_id: UUID,
    user_id: UUID,
) -> list[FileVersion]:
    """
    List versions for a file owned by the current user.
    """

    file_record = get_file_by_id(
        db,
        file_id,
        user_id,
    )

    if not file_record:
        raise ValueError(
            "File not found."
        )

    statement = (
        select(FileVersion)
        .where(
            FileVersion.file_id == file_id
        )
        .order_by(
            FileVersion.version_number.asc()
        )
    )

    return list(
        db.scalars(statement).all()
    )