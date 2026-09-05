import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share, SharePermission
from app.models.user import User


def get_user(
    db: Session,
    user_id: uuid.UUID,
) -> User | None:
    return db.scalar(
        select(User).where(
            User.id == user_id
        )
    )


def create_file_share(
    db: Session,
    *,
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
    permission: SharePermission,
) -> Share:
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == owner_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise ValueError("File not found.")

    if shared_with_user_id == owner_id:
        raise ValueError(
            "You cannot share a file with yourself."
        )

    user = get_user(
        db,
        shared_with_user_id,
    )

    if not user:
        raise ValueError(
            "Shared user not found."
        )

    existing = db.scalar(
        select(Share).where(
            Share.file_id == file_id,
            Share.shared_with_user_id
            == shared_with_user_id,
        )
    )

    if existing:
        raise ValueError(
            "File is already shared with this user."
        )

    share = Share(
        file_id=file_id,
        folder_id=None,
        shared_with_user_id=shared_with_user_id,
        permission=permission,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return share


def create_folder_share(
    db: Session,
    *,
    folder_id: uuid.UUID,
    owner_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
    permission: SharePermission,
) -> Share:
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.owner_id == owner_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise ValueError(
            "Folder not found."
        )

    if shared_with_user_id == owner_id:
        raise ValueError(
            "You cannot share a folder with yourself."
        )

    user = get_user(
        db,
        shared_with_user_id,
    )

    if not user:
        raise ValueError(
            "Shared user not found."
        )

    existing = db.scalar(
        select(Share).where(
            Share.folder_id == folder_id,
            Share.shared_with_user_id
            == shared_with_user_id,
        )
    )

    if existing:
        raise ValueError(
            "Folder is already shared with this user."
        )

    share = Share(
        file_id=None,
        folder_id=folder_id,
        shared_with_user_id=shared_with_user_id,
        permission=permission,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return share


def list_received_shares(
    db: Session,
    user_id: uuid.UUID,
) -> list[Share]:
    statement = (
        select(Share)
        .where(
            Share.shared_with_user_id == user_id
        )
        .order_by(
            Share.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_share_for_owner(
    db: Session,
    share_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> Share | None:
    """
    Find a share and verify that the current user
    owns the file or folder being shared.
    """

    share = db.scalar(
        select(Share).where(
            Share.id == share_id
        )
    )

    if not share:
        return None

    # File share
    if share.file_id:
        file_record = db.scalar(
            select(File).where(
                File.id == share.file_id,
                File.owner_id == owner_id,
            )
        )

        if not file_record:
            return None

    # Folder share
    if share.folder_id:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == share.folder_id,
                Folder.owner_id == owner_id,
            )
        )

        if not folder:
            return None

    return share


def update_share_permission(
    db: Session,
    share: Share,
    permission: SharePermission,
) -> Share:
    share.permission = permission

    db.commit()
    db.refresh(share)

    return share


def delete_share(
    db: Session,
    share: Share,
) -> None:
    db.delete(share)
    db.commit()