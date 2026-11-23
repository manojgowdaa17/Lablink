from flask import Flask
from flask_cors import CORS
from .config import Config, validate_env
from .extensions import mongo, init_db


def create_app():
    validate_env()
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = Config.SESSION_SECRET

    # Allow all localhost Vite ports (5173, 5174, 5175, etc.)
    cors_origins = Config.CORS_ORIGINS + [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
    ]
    CORS(app, origins=list(set(cors_origins)), supports_credentials=True)

    # Initialize MongoDB — raises RuntimeError with a clear message on failure
    init_db(app)

    from .routes import register_routes
    register_routes(app)

    # Create indexes after a confirmed connection
    try:
        from .utils.db_indexes import create_indexes
        create_indexes()
        app.logger.info("MongoDB indexes verified.")
    except Exception as e:
        # Log the real error — don't silently swallow it
        app.logger.error(f"Index creation failed: {e}")

    return app
