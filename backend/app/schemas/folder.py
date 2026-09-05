from datetime import datetime

from pydantic import BaseModel, Field


class FolderCreateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
    )

    parent_id: str | None = None


class FolderUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    parent_id: str | None = None


class FolderResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    parent_id: str | None
    is_deleted: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class FolderListResponse(BaseModel):
    folders: list[FolderResponse]
    total: int