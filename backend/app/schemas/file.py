from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: str
    name: str
    original_name: str
    mime_type: str
    size: int
    owner_id: str
    folder_id: str | None
    is_deleted: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class FileListResponse(BaseModel):
    files: list[FileResponse]
    total: int