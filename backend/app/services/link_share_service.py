import secrets
import uuid
from datetime import datetime, timezone

from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.link_share import LinkShare


password_hash = PasswordHash.recommended()


def create_link_share(
    db: Session,
    *,
    owner_id: uuid.UUID,
    file_id: uuid.UUID | None,
    folder_id: uuid.UUID | None,
    password: str | None,
    expires_at: datetime | None,
) -> LinkShare:
    if (file_id is None) == (folder_id is None):
        raise ValueError(
            "Provide exactly one of file_id or folder_id."
        )

    if file_id:
        file_record = db.scalar(
            select(File).where(
                File.id == file_id,
                File.owner_id == owner_id,
                File.is_deleted.is_(False),
            )
        )

        if not file_record:
            raise ValueError(
                "File not found."
            )

    if folder_id:
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

    if expires_at:
        if expires_at <= datetime.now(timezone.utc):
            raise ValueError(
                "Expiration must be in the future."
            )

    token = secrets.token_urlsafe(48)

    share = LinkShare(
        file_id=file_id,
        folder_id=folder_id,
        token=token,
        password_hash=(
            password_hash.hash(password)
            if password
            else None
        ),
        expires_at=expires_at,
        is_active=True,
        created_by=owner_id,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return share


def get_active_link(
    db: Session,
    token: str,
) -> LinkShare | None:
    share = db.scalar(
        select(LinkShare).where(
            LinkShare.token == token,
            LinkShare.is_active.is_(True),
        )
    )

    if not share:
        return None

    if share.expires_at:
        now = datetime.now(timezone.utc)

        if share.expires_at <= now:
            share.is_active = False
            db.commit()
            return None

    return share


def verify_link_password(
    share: LinkShare,
    password: str | None,
) -> bool:
    if not share.password_hash:
        return True

    if not password:
        return False

    return password_hash.verify(
        password,
        share.password_hash,
    )


def list_owner_links(
    db: Session,
    owner_id: uuid.UUID,
) -> list[LinkShare]:
    statement = (
        select(LinkShare)
        .where(
            LinkShare.created_by == owner_id
        )
        .order_by(
            LinkShare.created_at.desc()
        )
    )

    return list(db.scalars(statement).all())


def revoke_link(
    db: Session,
    share: LinkShare,
    owner_id: uuid.UUID,
) -> None:
    if share.created_by != owner_id:
        raise ValueError(
            "You are not allowed to revoke this link."
        )

    share.is_active = False

    db.commit()