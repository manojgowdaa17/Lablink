"""
MongoDB connection helper using plain pymongo.MongoClient.
flask-pymongo 2.x is incompatible with Flask 3.x (mongo.db returns None),
so we manage the client directly.
"""
import os
import re
import logging
from urllib.parse import quote_plus
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

logger = logging.getLogger(__name__)

# Module-level client and db — set once in init_db()
_client: MongoClient | None = None
_db = None


def init_db(app):
    """
    Create the MongoClient, verify the connection with a ping,
    and store the database object. Called from create_app().
    Raises RuntimeError with a clear message if connection fails.
    """
    global _client, _db

    uri = app.config.get("MONGO_URI")
    if not uri:
        raise RuntimeError(
            "MONGO_URI is not set. Check your backend/.env file."
        )

    # Strip Atlas placeholder angle brackets and encode the password.
    # Atlas connection strings use <password> as a placeholder — users
    # sometimes paste the URI with the brackets still included.
    # Pattern: mongodb[+srv]://user:password@host/...
    # Use rsplit('@', 1) so passwords containing '@' are handled correctly.
    if '://' in uri and '@' in uri:
        scheme_userinfo, hostpart = uri.split('://', 1).pop(0), uri.split('://', 1)[1]
        scheme = uri.split('://')[0] + '://'
        after_scheme = uri[len(scheme):]          # user:password@host/db
        # Split on the LAST @ to separate credentials from host
        at_idx = after_scheme.rfind('@')
        userinfo = after_scheme[:at_idx]           # user:password
        rest     = after_scheme[at_idx:]           # @host/db
        if ':' in userinfo:
            user, password = userinfo.split(':', 1)
            # Remove Atlas placeholder angle brackets if present
            password = password.strip('<').rstrip('>')
            # URL-encode both
            uri = f"{scheme}{quote_plus(user)}:{quote_plus(password)}{rest}"

    try:
        # serverSelectionTimeoutMS=10000 → give Atlas enough time for TLS
        # but still fail fast enough to show a clear error
        _client = MongoClient(uri, serverSelectionTimeoutMS=10000)

        # Force a real connection to verify the URI is reachable
        _client.admin.command("ping")

        # Extract the database name from the URI, default to "lablink"
        db_name = _client.get_database().name if _client.get_default_database else "lablink"
        try:
            db_name = _client.get_default_database().name
        except Exception:
            db_name = "lablink"

        _db = _client[db_name]
        logger.info(f"MongoDB connected — database: '{db_name}'")
        app.logger.info(f"MongoDB connected — database: '{db_name}'")

    except ConfigurationError as e:
        raise RuntimeError(
            f"MongoDB URI is malformed: {e}\n"
            f"Check MONGO_URI in backend/.env"
        )
    except ConnectionFailure as e:
        raise RuntimeError(
            f"Could not connect to MongoDB: {e}\n"
            f"Make sure MongoDB is running and MONGO_URI is correct in backend/.env\n"
            f"Current URI: {uri[:40]}..."
        )
    except Exception as e:
        raise RuntimeError(f"MongoDB init failed: {e}")


class _MongoProxy:
    """
    Thin proxy so the rest of the codebase can still write
    `mongo.db.collection` without any changes.
    """
    @property
    def db(self):
        if _db is None:
            raise RuntimeError(
                "MongoDB is not initialized. "
                "init_db() must be called before accessing mongo.db."
            )
        return _db

    @property
    def client(self):
        return _client


mongo = _MongoProxy()
