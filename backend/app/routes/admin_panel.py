from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..utils.session_manager import get_session, revoke_session
from bson import ObjectId
from datetime import datetime, timezone, timedelta

admin_panel_bp = Blueprint("admin_panel", __name__)

def require_admin(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("lablink_admin_session")
        if not token:
            return jsonify({"error": "Admin authentication required."}), 401
        session = get_session(token)
        if not session or session.get("role") != "admin":
            return jsonify({"error": "Access denied."}), 403
        admin = mongo.db.admin_users.find_one({"_id": ObjectId(session["user_id"])})
        if not admin:
            return jsonify({"error": "Admin not found."}), 401
        g.admin = admin
        g.admin_session_token = token
        return f(*args, **kwargs)
    return decorated

def serialize_dt(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

# --- Dashboard Stats ---
@admin_panel_bp.route("/stats", methods=["GET"])
@require_admin
def admin_stats():
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    stats = {
        "total_users":       mongo.db.users.count_documents({}),
        "total_equipment":   mongo.db.equipment.count_documents({}),
        "active_sessions":   mongo.db.user_sessions.count_documents({"status": "active", "expires_at": {"$gt": now}}),
        "pending_approvals": mongo.db.projects.count_documents({"status": "submitted"}),
        "todays_bookings":   mongo.db.bookings.count_documents({"created_at": {"$gte": today_start}}),
        "security_events":   mongo.db.security_events.count_documents({"created_at": {"$gte": today_start}}),
    }
    return jsonify(stats)

# --- User Management ---
@admin_panel_bp.route("/users", methods=["GET"])
@require_admin
def list_users():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 20)))
    skip     = (page - 1) * per_page
    role     = request.args.get("role")
    search   = request.args.get("search", "").strip()

    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    total = mongo.db.users.count_documents(query)
    users = list(
        mongo.db.users.find(query, {"password_hash": 0})
        .sort("created_at", -1).skip(skip).limit(per_page)
    )
    for u in users:
        u["id"] = str(u.pop("_id"))
        u["created_at"] = serialize_dt(u.get("created_at"))
    return jsonify({"items": users, "total": total, "page": page, "per_page": per_page})

@admin_panel_bp.route("/users/<user_id>/deactivate", methods=["PATCH"])
@require_admin
def deactivate_user(user_id):
    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID."}), 400
    now = datetime.now(timezone.utc)
    mongo.db.users.update_one({"_id": oid}, {"$set": {"is_active": False, "updated_at": now}})
    # Revoke all active sessions for this user
    sessions = mongo.db.user_sessions.find({"user_id": str(oid), "status": "active"})
    for s in sessions:
        revoke_session(s["token"])
    mongo.db.audit_logs.insert_one({
        "action": "user_deactivated",
        "actor_id": g.admin["_id"],
        "actor_role": "admin",
        "target_id": oid,
        "target_type": "user",
        "created_at": now,
    })
    return jsonify({"message": "User deactivated and sessions revoked."})

@admin_panel_bp.route("/users/<user_id>/activate", methods=["PATCH"])
@require_admin
def activate_user(user_id):
    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user ID."}), 400
    now = datetime.now(timezone.utc)
    mongo.db.users.update_one({"_id": oid}, {"$set": {"is_active": True, "updated_at": now}})
    return jsonify({"message": "User activated."})

# --- Equipment Management ---
@admin_panel_bp.route("/equipment", methods=["GET"])
@require_admin
def admin_list_equipment():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 20)))
    skip     = (page - 1) * per_page
    items = list(
        mongo.db.equipment.find({}).sort("name", 1).skip(skip).limit(per_page)
    )
    total = mongo.db.equipment.count_documents({})
    for e in items:
        e["id"] = str(e.pop("_id"))
        e["created_at"] = serialize_dt(e.get("created_at"))
        e["updated_at"]  = serialize_dt(e.get("updated_at"))
    return jsonify({"items": items, "total": total, "page": page, "per_page": per_page})

@admin_panel_bp.route("/equipment", methods=["POST"])
@require_admin
def admin_add_equipment():
    data = request.get_json(silent=True) or {}
    required = ["name", "category", "department", "lab_name", "lab_location", "short_description"]
    for field in required:
        if not data.get(field, "").strip():
            return jsonify({"error": f"{field} is required."}), 400
    now = datetime.now(timezone.utc)
    doc = {
        "name":              data["name"].strip(),
        "category":          data["category"].strip(),
        "department":        data["department"].strip(),
        "lab_name":          data["lab_name"].strip(),
        "lab_location":      data["lab_location"].strip(),
        "short_description": data["short_description"].strip(),
        "full_description":  data.get("full_description", "").strip(),
        "specifications":    data.get("specifications", {}),
        "status":            data.get("status", "available"),
        "is_featured":       bool(data.get("is_featured", False)),
        "access_level":      data.get("access_level", "open"),
        "image_url":         data.get("image_url", ""),
        "quantity":          int(data.get("quantity", 1)),
        "available_quantity": int(data.get("available_quantity", int(data.get("quantity", 1)))),
        "maintenance_schedule": [],
        "prerequisites":     data.get("prerequisites", []),
        "created_at":        now,
        "updated_at":        now,
    }
    result = mongo.db.equipment.insert_one(doc)
    mongo.db.audit_logs.insert_one({
        "action": "equipment_added",
        "actor_id": g.admin["_id"],
        "actor_role": "admin",
        "target_id": result.inserted_id,
        "target_type": "equipment",
        "details": {"name": doc["name"]},
        "created_at": now,
    })
    return jsonify({"message": "Equipment added.", "id": str(result.inserted_id)}), 201

@admin_panel_bp.route("/equipment/<equipment_id>", methods=["PATCH"])
@require_admin
def admin_update_equipment(equipment_id):
    try:
        oid = ObjectId(equipment_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    if not mongo.db.equipment.find_one({"_id": oid}):
        return jsonify({"error": "Equipment not found."}), 404
    data    = request.get_json(silent=True) or {}
    allowed = ["name","category","department","lab_name","lab_location","short_description",
               "full_description","specifications","status","is_featured","access_level",
               "image_url","quantity","available_quantity","prerequisites"]
    update  = {k: data[k] for k in allowed if k in data}
    if not update:
        return jsonify({"error": "No valid fields to update."}), 400
    update["updated_at"] = datetime.now(timezone.utc)
    mongo.db.equipment.update_one({"_id": oid}, {"$set": update})
    return jsonify({"message": "Equipment updated."})

@admin_panel_bp.route("/equipment/<equipment_id>", methods=["DELETE"])
@require_admin
def admin_delete_equipment(equipment_id):
    try:
        oid = ObjectId(equipment_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    eq = mongo.db.equipment.find_one({"_id": oid})
    if not eq:
        return jsonify({"error": "Equipment not found."}), 404
    # Check for active bookings
    active = mongo.db.bookings.count_documents({"equipment_id": oid, "status": "confirmed"})
    if active > 0:
        return jsonify({"error": f"Cannot delete equipment with {active} active booking(s)."}), 409
    mongo.db.equipment.delete_one({"_id": oid})
    mongo.db.audit_logs.insert_one({
        "action": "equipment_deleted",
        "actor_id": g.admin["_id"],
        "actor_role": "admin",
        "target_id": oid,
        "target_type": "equipment",
        "details": {"name": eq.get("name", "")},
        "created_at": datetime.now(timezone.utc),
    })
    return jsonify({"message": "Equipment deleted."})

# --- Session Monitoring ---
@admin_panel_bp.route("/sessions", methods=["GET"])
@require_admin
def list_sessions():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 20)))
    skip     = (page - 1) * per_page
    status   = request.args.get("status", "active")
    now      = datetime.now(timezone.utc)

    query = {"status": status} if status != "all" else {}
    total    = mongo.db.user_sessions.count_documents(query)
    sessions = list(
        mongo.db.user_sessions.find(query, {"token": 0})
        .sort("created_at", -1).skip(skip).limit(per_page)
    )
    for s in sessions:
        s["id"]          = str(s.pop("_id"))
        s["user_id"]     = str(s.get("user_id", ""))
        s["created_at"]  = serialize_dt(s.get("created_at"))
        s["last_active"] = serialize_dt(s.get("last_active"))
        s["expires_at"]  = serialize_dt(s.get("expires_at"))
        s["revoked_at"]  = serialize_dt(s.get("revoked_at"))
    return jsonify({"items": sessions, "total": total, "page": page, "per_page": per_page})

@admin_panel_bp.route("/sessions/<session_id>/revoke", methods=["PATCH"])
@require_admin
def revoke_session_admin(session_id):
    try:
        oid = ObjectId(session_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    s = mongo.db.user_sessions.find_one({"_id": oid})
    if not s:
        return jsonify({"error": "Session not found."}), 404
    revoke_session(s["token"])
    mongo.db.audit_logs.insert_one({
        "action": "session_revoked",
        "actor_id": g.admin["_id"],
        "actor_role": "admin",
        "target_id": oid,
        "target_type": "session",
        "created_at": datetime.now(timezone.utc),
    })
    return jsonify({"message": "Session revoked."})

# --- Audit Logs ---
@admin_panel_bp.route("/audit-logs", methods=["GET"])
@require_admin
def audit_logs():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 20)))
    skip     = (page - 1) * per_page
    action   = request.args.get("action")
    role     = request.args.get("actor_role")

    query = {}
    if action:
        query["action"] = action
    if role:
        query["actor_role"] = role

    total = mongo.db.audit_logs.count_documents(query)
    logs  = list(
        mongo.db.audit_logs.find(query, {"password_hash": 0})
        .sort("created_at", -1).skip(skip).limit(per_page)
    )
    for log in logs:
        log["id"]         = str(log.pop("_id"))
        log["actor_id"]   = str(log.get("actor_id", ""))
        log["target_id"]  = str(log.get("target_id", "")) if log.get("target_id") else None
        log["created_at"] = serialize_dt(log.get("created_at"))
    return jsonify({"items": logs, "total": total, "page": page, "per_page": per_page})

# --- Booking Monitoring ---
@admin_panel_bp.route("/bookings", methods=["GET"])
@require_admin
def admin_bookings():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 20)))
    skip     = (page - 1) * per_page
    status   = request.args.get("status")
    query    = {}
    if status:
        query["status"] = status
    total  = mongo.db.bookings.count_documents(query)
    items  = list(mongo.db.bookings.find(query, {"qr_code_token": 0}).sort("created_at", -1).skip(skip).limit(per_page))
    for b in items:
        b["id"]          = str(b.pop("_id"))
        b["student_id"]  = str(b.get("student_id", ""))
        b["equipment_id"]= str(b.get("equipment_id", ""))
        for f in ["start_time","end_time","approved_at","created_at","updated_at"]:
            b[f] = serialize_dt(b.get(f))
    return jsonify({"items": items, "total": total, "page": page, "per_page": per_page})

# --- Analytics ---
@admin_panel_bp.route("/analytics/departments", methods=["GET"])
@require_admin
def dept_analytics():
    pipeline = [
        {"$group": {"_id": "$department", "total": {"$sum": 1}, "available": {"$sum": {"$cond": [{"$eq": ["$status", "available"]}, 1, 0]}}}},
        {"$sort": {"total": -1}},
    ]
    result = list(mongo.db.equipment.aggregate(pipeline))
    for r in result:
        r["department"] = r.pop("_id")
    return jsonify({"departments": result})

@admin_panel_bp.route("/analytics/bookings-by-status", methods=["GET"])
@require_admin
def bookings_by_status():
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = list(mongo.db.bookings.aggregate(pipeline))
    return jsonify({"data": [{"status": r["_id"], "count": r["count"]} for r in result]})
