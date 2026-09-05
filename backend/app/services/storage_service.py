from io import BytesIO

from app.core.config import settings
from app.core.supabase import supabase


def upload_file(
    storage_path: str,
    file_data: bytes,
    content_type: str,
) -> None:
    """
    Upload a file to Supabase Storage.
    """

    supabase.storage.from_(
        settings.SUPABASE_STORAGE_BUCKET
    ).upload(
        path=storage_path,
        file=BytesIO(file_data),
        file_options={
            "content-type": content_type,
            "upsert": False,
        },
    )


def download_file(
    storage_path: str,
) -> bytes:
    """
    Download a file from Supabase Storage.
    """

    return supabase.storage.from_(
        settings.SUPABASE_STORAGE_BUCKET
    ).download(storage_path)


def delete_file(
    storage_path: str,
) -> None:
    """
    Delete a file from Supabase Storage.
    """

    supabase.storage.from_(
        settings.SUPABASE_STORAGE_BUCKET
    ).remove([storage_path])


def restore_file(
    storage_path: str,
    file_data: bytes,
    content_type: str,
) -> None:
    """
    Restore a file to Supabase Storage.
    """

    supabase.storage.from_(
        settings.SUPABASE_STORAGE_BUCKET
    ).upload(
        path=storage_path,
        file=BytesIO(file_data),
        file_options={
            "content-type": content_type,
            "upsert": True,
        },
    )