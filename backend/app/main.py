from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

from app.core.database import test_database_connection

from app.routes.auth import router as auth_router
from app.routes.folders import router as folder_router
from app.routes.files import router as file_router
from app.routes.versions import router as version_router
from app.routes.sharing import router as sharing_router
from app.routes.link_shares import router as link_share_router
from app.routes.stars import router as star_router
from app.routes.activity import router as activity_router
from app.routes.trash import router as trash_router
from app.routes.search import router as search_router


app = FastAPI(
    title="VaultIQ API",
    description="Secure cloud-based file storage and sharing platform.",
    version="1.0.0",
)


# --------------------------------------------------
# SESSION MIDDLEWARE
# --------------------------------------------------

SESSION_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY"
)

if not SESSION_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not configured in the environment."
    )

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    same_site="lax",
    https_only=False,
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://vault-iq-sigma-pied.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# ROUTERS
# --------------------------------------------------

app.include_router(auth_router)
app.include_router(folder_router)
app.include_router(file_router)
app.include_router(version_router)
app.include_router(sharing_router)
app.include_router(link_share_router)
app.include_router(star_router)
app.include_router(activity_router)
app.include_router(trash_router)
app.include_router(search_router)


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "VaultIQ API is running",
        "status": "success",
    }


# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VaultIQ API",
    }


# --------------------------------------------------
# DATABASE TEST
# --------------------------------------------------

@app.get("/database-test")
def database_test():
    result = test_database_connection()

    return {
        "database": "connected",
        "test_result": result,
    }