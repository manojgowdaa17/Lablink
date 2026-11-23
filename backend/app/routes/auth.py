from flask import Blueprint, request, jsonify, make_response, g
from ..extensions import mongo
from ..utils.security import hash_password, verify_password
from ..utils.validators import validate_email, validate_password, sanitize_string
from ..utils.session_manager import create_session, revoke_session
from ..middleware.auth import require_auth
from datetime import datetime, timezone, timedelta

auth_bp = Blueprint("auth", __name__)

LOCKOUT_THRESHOLD = 5

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name     = sanitize_string(data.get("name", ""), 100)
    email    = sanitize_string(data.get("email", ""), 150).lower()
    role     = data.get("role", "student")
    dept     = sanitize_string(data.get("department", ""), 100)
    password = data.get("password", "")
    roll     = sanitize_string(data.get("roll_number", ""), 20).upper()

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400
    if not validate_email(email):
        return jsonify({"error": "Invalid email address."}), 400
    if role not in ("student", "faculty"):
        return jsonify({"error": "Role must be student or faculty."}), 400
    pw_ok, pw_msg = validate_password(password)
    if not pw_ok:
        return jsonify({"error": pw_msg}), 400
    if role == "student" and not roll:
        return jsonify({"error": "Roll number is required for students."}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists."}), 409

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": name,
        "email": email,
        "role": role,
        "department": dept,
        "password_hash": hash_password(password),
        "roll_number": roll if role == "student" else None,
        "is_active": True,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": now,
        "updated_at": now,
    }
    result = mongo.db.users.insert_one(user_doc)
    return jsonify({
        "message": "Account created successfully.",
        "user": {
            "id": str(result.inserted_id),
            "name": name,
            "email": email,
            "role": role,
            "department": dept,
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data  = request.get_json(silent=True) or {}
    email = sanitize_string(data.get("email", ""), 150).lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    now  = datetime.now(timezone.utc)
    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    # Lockout check — make timezone-aware if MongoDB returned naive datetime
    locked_until = user.get("locked_until")
    if locked_until:
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            return jsonify({"error": "Account temporarily locked. Try again later."}), 429

    if not verify_password(user["password_hash"], password):
        attempts = user.get("failed_login_attempts", 0) + 1
        update = {"failed_login_attempts": attempts, "updated_at": now}
        if attempts >= LOCKOUT_THRESHOLD:
            update["locked_until"] = now + timedelta(minutes=15)
        mongo.db.users.update_one({"_id": user["_id"]}, {"$set": update})
        return jsonify({"error": "Invalid email or password."}), 401

    # Reset failed attempts
    mongo.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_attempts": 0, "locked_until": None, "updated_at": now}}
    )

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ua = request.headers.get("User-Agent", "")
    token = create_session(str(user["_id"]), user["role"], ip, ua)

    resp = make_response(jsonify({
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user.get("department", ""),
        }
    }), 200)
    resp.set_cookie(
        "lablink_session", token,
        httponly=True, secure=False,
        samesite="Lax",
        max_age=8 * 3600,
        path="/"
    )
    return resp

@auth_bp.route("/logout", methods=["POST"])
def logout():
    token = request.cookies.get("lablink_session")
    if token:
        revoke_session(token)
    resp = make_response(jsonify({"message": "Logged out."}), 200)
    resp.delete_cookie("lablink_session", path="/")
    return resp

@auth_bp.route("/me", methods=["GET"])
@require_auth(roles=["student", "faculty"])
def me():
    u = g.user
    return jsonify({
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "department": u.get("department", ""),
    })
