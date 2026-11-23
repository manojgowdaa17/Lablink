from functools import wraps
from flask import request, jsonify, g
from ..utils.session_manager import get_session
from ..extensions import mongo
from bson import ObjectId

def require_auth(roles=None):
    """Decorator: validates session token from HttpOnly cookie."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.cookies.get("lablink_session")
            if not token:
                return jsonify({"error": "Authentication required."}), 401
            session = get_session(token)
            if not session:
                return jsonify({"error": "Session expired or invalid."}), 401
            if roles and session.get("role") not in roles:
                return jsonify({"error": "Access denied."}), 403
            # Attach user to g
            coll = "admin_users" if session["role"] == "admin" else "users"
            user = mongo.db[coll].find_one({"_id": ObjectId(session["user_id"])})
            if not user:
                return jsonify({"error": "User not found."}), 401
            g.user = user
            g.session_token = token
            g.role = session["role"]
            return f(*args, **kwargs)
        return decorated
    return decorator
