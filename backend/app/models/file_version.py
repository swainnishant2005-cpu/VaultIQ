import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class FileVersion(Base):
    __tablename__ = "file_versions"

    __table_args__ = (
        UniqueConstraint(
            "file_id",
            "version_number",
            name="uq_file_version_number",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
    )

    size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    file = relationship(
        "File",
        back_populates="versions",
    )

    creator = relationship(
        "User",
        back_populates="created_versions",
        foreign_keys=[created_by],
    )