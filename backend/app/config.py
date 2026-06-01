import os
from dotenv import load_dotenv

# Load local .env if available
load_dotenv()

class Settings:
    # Fallback gracefully to a local SQLite database if no PostgreSQL URL is present in the environment
    default_db_url = "sqlite:///./inventory.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db_url)
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:5173,http://localhost:80,http://127.0.0.1:3000"
    )

settings = Settings()
