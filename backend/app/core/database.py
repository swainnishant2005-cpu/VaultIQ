from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()

def get_db():
    """
    Provide a SQLAlchemy database session to FastAPI routes.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()