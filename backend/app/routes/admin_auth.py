import random
from flask import Blueprint, request, jsonify, make_response
from ..extensions import mongo
from ..utils.security import verify_password
from ..utils.validators import sanitize_string
from ..utils.session_manager import create_session, revoke_session, get_session
from datetime import datetime, timezone, timedelta
from bson import ObjectId

admin_auth_bp = Blueprint("admin_auth", __name__)

CODE_TTL_SECONDS = 300  # 5 minutes


def _issue_code(email: str) -> str:
    """Generate a 6-digit code, store in MongoDB, and print to terminal."""
    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=CODE_TTL_SECONDS)

    # Upsert — one pending code per email at a time
    mongo.db.admin_pending_codes.update_one(
        {"email": email},
        {"$set": {"code": code, "expires_at": expires_at}},
        upsert=True,
    )

    print(f"\n{'='*50}")
    print(f"  LabLink Admin Verification Code")
    print(f"  Email : {email}")
    print(f"  Code  : {code}")
    print(f"  Valid for {CODE_TTL_SECONDS // 60} minutes")
    print(f"{'='*50}\n", flush=True)
    return code


def _verify_code(email: str, code: str) -> bool:
    """Verify code from MongoDB, then delete it (one-time use)."""
    now = datetime.now(timezone.utc)
    record = mongo.db.admin_pending_codes.find_one({"email": email})
    if not record:
        return False

    expires_at = record.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            mongo.db.admin_pending_codes.delete_one({"email": email})
            return False

    if record.get("code") != code.strip():
        return False

    # Consume — one-time use
    mongo.db.admin_pending_codes.delete_one({"email": email})
    return True


# POST /api/admin/request-code
@admin_auth_bp.route("/request-code", methods=["POST"])
def request_code():
    data     = request.get_json(silent=True) or {}
    email    = sanitize_string(data.get("email", ""), 150).lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    admin = mongo.db.admin_users.find_one({"email": email, "is_active": True})
    if not admin or not verify_password(admin["password_hash"], password):
        return jsonify({"error": "Invalid credentials."}), 401

    _issue_code(email)
    return jsonify({"message": "Verification code printed to the server terminal."}), 200


# POST /api/admin/login
@admin_auth_bp.route("/login", methods=["POST"])
def admin_login():
    data      = request.get_json(silent=True) or {}
    email     = sanitize_string(data.get("email", ""), 150).lower()
    password  = data.get("password", "")
    code      = str(data.get("totp_code", "")).strip()

    if not email or not password or not code:
        return jsonify({"error": "Email, password and verification code are required."}), 400

    now   = datetime.now(timezone.utc)
    admin = mongo.db.admin_users.find_one({"email": email, "is_active": True})
    if not admin or not verify_password(admin["password_hash"], password):
        return jsonify({"error": "Invalid credentials."}), 401

    if not _verify_code(email, code):
        return jsonify({"error": "Invalid or expired verification code. Request a new one."}), 401

    ip    = request.headers.get("X-Forwarded-For", request.remote_addr)
    ua    = request.headers.get("User-Agent", "")
    token = create_session(str(admin["_id"]), "admin", ip, ua)

    mongo.db.admin_users.update_one(
        {"_id": admin["_id"]},
        {"$set": {"last_login": now}}
    )

    resp = make_response(jsonify({
        "admin": {
            "id":    str(admin["_id"]),
            "name":  admin["name"],
            "email": admin["email"],
        }
    }), 200)
    resp.set_cookie(
        "lablink_admin_session", token,
        httponly=True, secure=False,
        samesite="Lax",
        max_age=4 * 3600,
        path="/"
    )
    return resp


# POST /api/admin/logout
@admin_auth_bp.route("/logout", methods=["POST"])
def admin_logout():
    token = request.cookies.get("lablink_admin_session")
    if token:
        revoke_session(token)
    resp = make_response(jsonify({"message": "Logged out."}), 200)
    resp.delete_cookie("lablink_admin_session", path="/")
    return resp


# GET /api/admin/me
@admin_auth_bp.route("/me", methods=["GET"])
def admin_me():
    token = request.cookies.get("lablink_admin_session")
    if not token:
        return jsonify({"error": "Authentication required."}), 401
    session = get_session(token)
    if not session or session.get("role") != "admin":
        return jsonify({"error": "Access denied."}), 403
    admin = mongo.db.admin_users.find_one({"_id": ObjectId(session["user_id"])})
    if not admin:
        return jsonify({"error": "Admin not found."}), 404
    return jsonify({
        "id":    str(admin["_id"]),
        "name":  admin["name"],
        "email": admin["email"],
    })
