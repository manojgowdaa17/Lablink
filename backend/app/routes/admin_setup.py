from flask import Blueprint, request, jsonify
from ..extensions import mongo
from ..utils.security import hash_password
from ..utils.validators import sanitize_string, validate_email, validate_password
from ..config import Config
from datetime import datetime, timezone

admin_setup_bp = Blueprint("admin_setup", __name__)

@admin_setup_bp.route("/setup", methods=["POST"])
def setup_admin():
    secret_header = request.headers.get("X-Setup-Secret", "")
    if not secret_header or secret_header != Config.ADMIN_SETUP_SECRET:
        return jsonify({"error": "Forbidden."}), 403

    data     = request.get_json(silent=True) or {}
    name     = sanitize_string(data.get("name", ""), 100)
    email    = sanitize_string(data.get("email", ""), 150).lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400
    if not validate_email(email):
        return jsonify({"error": "Invalid email."}), 400
    pw_ok, pw_msg = validate_password(password)
    if not pw_ok:
        return jsonify({"error": pw_msg}), 400

    if mongo.db.admin_users.find_one({"email": email}):
        return jsonify({"error": "Admin with this email already exists."}), 409

    now = datetime.now(timezone.utc)
    result = mongo.db.admin_users.insert_one({
        "name":          name,
        "email":         email,
        "password_hash": hash_password(password),
        "is_active":     True,
        "created_at":    now,
        "last_login":    None,
    })
    return jsonify({
        "message":  "Admin account created successfully.",
        "admin_id": str(result.inserted_id),
        "email":    email,
        "note":     "Login uses a 6-digit code printed to the server terminal — no authenticator app needed.",
    }), 201
