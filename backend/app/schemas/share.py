from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SharePermission(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"


class CreateShareRequest(BaseModel):
    shared_with_user_id: str
    permission: SharePermission = SharePermission.VIEWER


class UpdateShareRequest(BaseModel):
    permission: SharePermission


class ShareResponse(BaseModel):
    id: str
    file_id: str | None
    folder_id: str | None
    shared_with_user_id: str
    permission: str
    created_at: datetime
    updated_at: datetime