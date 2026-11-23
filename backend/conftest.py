import os
import pytest

# Set test environment variables before anything imports the app
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/lablink_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-for-testing-only")
os.environ.setdefault("ADMIN_SETUP_SECRET", "test-admin-setup-secret")
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("GEMINI_API_KEY", "")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
