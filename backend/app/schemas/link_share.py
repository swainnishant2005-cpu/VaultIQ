from datetime import datetime

from pydantic import BaseModel, Field


class CreateLinkShareRequest(BaseModel):
    file_id: str | None = None
    folder_id: str | None = None
    password: str | None = Field(
        default=None,
        min_length=4,
    )
    expires_at: datetime | None = None


class LinkShareResponse(BaseModel):
    id: str
    file_id: str | None
    folder_id: str | None
    token: str
    expires_at: datetime | None
    is_active: bool
    created_by: str
    created_at: datetime


class LinkAccessRequest(BaseModel):
    password: str | None = None