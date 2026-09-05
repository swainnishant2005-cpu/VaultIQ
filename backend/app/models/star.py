import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base


class Star(Base):
    __tablename__ = "stars"

    __table_args__ = (
        CheckConstraint(
            """
            (file_id IS NOT NULL AND folder_id IS NULL)
            OR
            (file_id IS NULL AND folder_id IS NOT NULL)
            """,
            name="ck_star_exactly_one_target",
        ),
        UniqueConstraint(
            "user_id",
            "file_id",
            name="uq_star_user_file",
        ),
        UniqueConstraint(
            "user_id",
            "folder_id",
            name="uq_star_user_folder",
        ),
    )

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

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )