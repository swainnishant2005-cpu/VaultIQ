from datetime import datetime

from pydantic import BaseModel


class FileVersionResponse(BaseModel):
    id: str
    file_id: str
    version_number: int
    storage_path: str
    size: int
    mime_type: str
    created_by: str
    created_at: datetime