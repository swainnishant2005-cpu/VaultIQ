import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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

    owned_folders = relationship(
        "Folder",
        back_populates="owner",
        foreign_keys="Folder.owner_id",
        cascade="all, delete-orphan",
    )

    owned_files = relationship(
        "File",
        back_populates="owner",
        foreign_keys="File.owner_id",
        cascade="all, delete-orphan",
    )

    created_versions = relationship(
        "FileVersion",
        back_populates="creator",
        foreign_keys="FileVersion.created_by",
    )

    shares_received = relationship(
        "Share",
        back_populates="shared_with_user",
        foreign_keys="Share.shared_with_user_id",
    )

    activities = relationship(
        "Activity",
        back_populates="user",
        foreign_keys="Activity.user_id",
        cascade="all, delete-orphan",
    )