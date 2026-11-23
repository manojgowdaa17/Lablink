import os
from dotenv import load_dotenv

# Load .env immediately when this module is imported.
# find_dotenv=True searches parent dirs so it works regardless of cwd.
load_dotenv(override=False)

REQUIRED_VARS = [
    "MONGO_URI",
    "SECRET_KEY",
    "SESSION_SECRET",
    "ADMIN_SETUP_SECRET",
]

def validate_env():
    # Skip strict validation in test mode
    if os.getenv("FLASK_ENV") in ("testing", "test"):
        return
    missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"Make sure backend/.env exists and is populated correctly."
        )


class Config:
    # Read at class-definition time — load_dotenv() above ensures the file
    # is already loaded before this executes.
    MONGO_URI          = os.getenv("MONGO_URI")
    GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
    SECRET_KEY         = os.getenv("SECRET_KEY")
    SESSION_SECRET     = os.getenv("SESSION_SECRET")
    ADMIN_SETUP_SECRET = os.getenv("ADMIN_SETUP_SECRET")
    FLASK_ENV          = os.getenv("FLASK_ENV", "production")
    FLASK_DEBUG        = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    CORS_ORIGINS       = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
