from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.search import (
    SearchResponse,
    SearchFileResponse,
    SearchFolderResponse,
)
from app.services.search_service import (
    search_files,
    search_folders,
)


router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


@router.get(
    "",
    response_model=SearchResponse,
)
def search(
    q: str = Query(
        ...,
        min_length=1,
        max_length=255,
    ),
    mime_type: str | None = Query(
        default=None,
    ),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    query = q.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty.",
        )

    files = search_files(
        db=db,
        user_id=current_user.id,
        query=query,
        mime_type=mime_type,
    )

    folders = search_folders(
        db=db,
        user_id=current_user.id,
        query=query,
    )

    file_results = [
        SearchFileResponse(
            id=str(file.id),
            name=file.name,
            original_name=file.original_name,
            mime_type=file.mime_type,
            size=file.size,
            folder_id=(
                str(file.folder_id)
                if file.folder_id
                else None
            ),
            created_at=file.created_at,
            updated_at=file.updated_at,
        )
        for file in files
    ]

    folder_results = [
        SearchFolderResponse(
            id=str(folder.id),
            name=folder.name,
            parent_id=(
                str(folder.parent_id)
                if folder.parent_id
                else None
            ),
            created_at=folder.created_at,
            updated_at=folder.updated_at,
        )
        for folder in folders
    ]

    return SearchResponse(
        files=file_results,
        folders=folder_results,
        total_files=len(file_results),
        total_folders=len(folder_results),
        total=(
            len(file_results)
            + len(folder_results)
        ),
    )