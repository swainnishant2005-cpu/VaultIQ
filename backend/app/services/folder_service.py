from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.folder import Folder


def get_folder_by_id(
    db: Session,
    folder_id: UUID,
    user_id: UUID,
) -> Folder | None:
    """
    Return a folder only if it belongs to the current user.
    """

    statement = select(Folder).where(
        Folder.id == folder_id,
        Folder.owner_id == user_id,
    )

    return db.scalar(statement)


def create_folder(
    db: Session,
    user_id: UUID,
    name: str,
    parent_id: UUID | None = None,
) -> Folder:
    """
    Create a folder owned by the current user.
    """

    name = name.strip()

    if not name:
        raise ValueError(
            "Folder name cannot be empty."
        )

    # --------------------------------------------------
    # Validate parent folder
    # --------------------------------------------------

    if parent_id is not None:
        parent = get_folder_by_id(
            db,
            parent_id,
            user_id,
        )

        if not parent:
            raise ValueError(
                "Parent folder not found."
            )

        if parent.is_deleted:
            raise ValueError(
                "Cannot create a folder inside a deleted folder."
            )

    # --------------------------------------------------
    # Prevent duplicate folder names
    # --------------------------------------------------

    statement = select(Folder).where(
        Folder.owner_id == user_id,
        Folder.parent_id == parent_id,
        Folder.name == name,
        Folder.is_deleted.is_(False),
    )

    existing_folder = db.scalar(statement)

    if existing_folder:
        raise ValueError(
            "A folder with this name already exists here."
        )

    # --------------------------------------------------
    # Create folder
    # --------------------------------------------------

    folder = Folder(
        name=name,
        owner_id=user_id,
        parent_id=parent_id,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder


def list_folders(
    db: Session,
    user_id: UUID,
    parent_id: UUID | None = None,
) -> list[Folder]:
    """
    List folders belonging to the current user
    inside a specific parent folder.
    """

    statement = (
        select(Folder)
        .where(
            Folder.owner_id == user_id,
            Folder.parent_id == parent_id,
            Folder.is_deleted.is_(False),
        )
        .order_by(Folder.name.asc())
    )

    return list(db.scalars(statement).all())


def update_folder(
    db: Session,
    folder: Folder,
    name: str | None = None,
    parent_id: UUID | None = None,
) -> Folder:
    """
    Rename or move a folder.
    """

    if name is not None:
        name = name.strip()

        if not name:
            raise ValueError(
                "Folder name cannot be empty."
            )

        folder.name = name

    if parent_id is not None:

        if parent_id == folder.id:
            raise ValueError(
                "A folder cannot be its own parent."
            )

        parent = get_folder_by_id(
            db,
            parent_id,
            folder.owner_id,
        )

        if not parent:
            raise ValueError(
                "Parent folder not found."
            )

        if parent.is_deleted:
            raise ValueError(
                "Cannot move a folder into a deleted folder."
            )

        folder.parent_id = parent_id

    db.commit()
    db.refresh(folder)

    return folder


def soft_delete_folder(
    db: Session,
    folder: Folder,
) -> Folder:
    """
    Soft-delete a folder.
    """

    from datetime import datetime, timezone

    folder.is_deleted = True
    folder.deleted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(folder)

    return folder