import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class SharePermission(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"


class Share(Base):
    __tablename__ = "shares"

    __table_args__ = (
        CheckConstraint(
            """
            (file_id IS NOT NULL AND folder_id IS NULL)
            OR
            (file_id IS NULL AND folder_id IS NOT NULL)
            """,
            name="ck_share_exactly_one_target",
        ),
        UniqueConstraint(
            "file_id",
            "shared_with_user_id",
            name="uq_file_shared_user",
        ),
        UniqueConstraint(
            "folder_id",
            "shared_with_user_id",
            name="uq_folder_shared_user",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    folder_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    shared_with_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    permission: Mapped[SharePermission] = mapped_column(
        SQLEnum(
            SharePermission,
            name="share_permission",
        ),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    shared_with_user = relationship(
        "User",
        back_populates="shares_received",
        foreign_keys=[shared_with_user_id],
    )