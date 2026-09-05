from datetime import datetime

from pydantic import BaseModel


class SearchFileResponse(BaseModel):
    id: str
    name: str
    original_name: str
    mime_type: str
    size: int
    folder_id: str | None
    created_at: datetime
    updated_at: datetime


class SearchFolderResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None
    created_at: datetime
    updated_at: datetime


class SearchResponse(BaseModel):
    files: list[SearchFileResponse]
    folders: list[SearchFolderResponse]
    total_files: int
    total_folders: int
    total: int