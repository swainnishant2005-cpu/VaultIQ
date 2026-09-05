import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class ActivityAction(str, Enum):
    UPLOAD = "UPLOAD"
    DOWNLOAD = "DOWNLOAD"
    CREATE_FOLDER = "CREATE_FOLDER"
    RENAME = "RENAME"
    MOVE = "MOVE"
    DELETE = "DELETE"
    RESTORE = "RESTORE"
    SHARE = "SHARE"
    UNSHARE = "UNSHARE"
    STAR = "STAR"
    UNSTAR = "UNSTAR"
    CREATE_LINK = "CREATE_LINK"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    action: Mapped[ActivityAction] = mapped_column(
        SQLEnum(
            ActivityAction,
            name="activity_action",
        ),
        nullable=False,
        index=True,
    )

    file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    folder_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    extra_data: Mapped[dict | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="activities",
        foreign_keys=[user_id],
    )