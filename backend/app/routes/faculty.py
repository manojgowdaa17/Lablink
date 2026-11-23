from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone

faculty_bp = Blueprint("faculty", __name__)

def serialize_project(p):
    p["id"] = str(p.pop("_id"))
    p["student_id"] = str(p.get("student_id", ""))
    for f in ["created_at","updated_at","preferred_start_date","preferred_end_date","deadline"]:
        if isinstance(p.get(f), datetime):
            p[f] = p[f].isoformat()
    p["equipment_requested"] = [str(e) for e in p.get("equipment_requested", [])]
    return p

def serialize_booking(b):
    b["id"] = str(b.pop("_id"))
    b["student_id"]   = str(b.get("student_id", ""))
    b["equipment_id"] = str(b.get("equipment_id", ""))
    b["approved_by"]  = str(b.get("approved_by", "")) if b.get("approved_by") else None
    for f in ["start_time","end_time","approved_at","created_at","updated_at"]:
        if isinstance(b.get(f), datetime):
            b[f] = b[f].isoformat()
    return b

# GET /api/faculty/stats
@faculty_bp.route("/stats", methods=["GET"])
@require_auth(roles=["faculty"])
def faculty_stats():
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    week_ago = now - timedelta(days=7)
    stats = {
        "pending_approvals":    mongo.db.projects.count_documents({"status": "submitted"}),
        "approved_this_week":   mongo.db.bookings.count_documents({"approved_at": {"$gte": week_ago}, "status": "confirmed"}),
        "active_bookings":      mongo.db.bookings.count_documents({"status": "confirmed", "end_time": {"$gt": now}}),
        "total_pending_bookings": mongo.db.bookings.count_documents({"status": "pending_approval"}),
    }
    return jsonify(stats)

# GET /api/faculty/requests — list all submitted project requests
@faculty_bp.route("/requests", methods=["GET"])
@require_auth(roles=["faculty"])
def list_requests():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(20, int(request.args.get("per_page", 10)))
    skip     = (page - 1) * per_page
    status   = request.args.get("status", "submitted")

    query = {}
    if status != "all":
        query["status"] = status

    total = mongo.db.projects.count_documents(query)
    items = list(mongo.db.projects.find(query).sort("created_at", 1).skip(skip).limit(per_page))
    return jsonify({
        "items": [serialize_project(p) for p in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    })

# GET /api/faculty/requests/<id>
@faculty_bp.route("/requests/<project_id>", methods=["GET"])
@require_auth(roles=["faculty"])
def get_request(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Request not found."}), 404
    # Enrich with equipment names
    eq_names = []
    for eid in p.get("equipment_requested", []):
        eq = mongo.db.equipment.find_one({"_id": eid}, {"name": 1, "status": 1, "department": 1})
        if eq:
            eq_names.append({"id": str(eq["_id"]), "name": eq["name"], "status": eq.get("status"), "department": eq.get("department")})
    result = serialize_project(p)
    result["equipment_details"] = eq_names
    return jsonify(result)

# PATCH /api/faculty/requests/<id>/approve
@faculty_bp.route("/requests/<project_id>/approve", methods=["PATCH"])
@require_auth(roles=["faculty"])
def approve_request(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Request not found."}), 404
    if p["status"] not in ("submitted", "under_review"):
        return jsonify({"error": "Only submitted or under-review requests can be approved."}), 400

    data         = request.get_json(silent=True) or {}
    faculty_notes = str(data.get("faculty_notes", "")).strip()[:500]
    now          = datetime.now(timezone.utc)

    # Approve all pending_approval bookings linked to this project
    mongo.db.bookings.update_many(
        {"request_id": oid, "status": "pending_approval"},
        {"$set": {
            "status": "confirmed",
            "approved_by": g.user["_id"],
            "approved_at": now,
            "updated_at": now,
        }}
    )

    # Update project status
    mongo.db.projects.update_one(
        {"_id": oid},
        {"$set": {
            "status": "approved",
            "faculty_notes": faculty_notes,
            "updated_at": now,
        }}
    )

    # Create a notification for the student
    mongo.db.notifications.insert_one({
        "user_id":   p["student_id"],
        "type":      "approval",
        "title":     "Project Request Approved",
        "message":   f'Your project "{p["project_title"]}" has been approved.',
        "read":      False,
        "created_at": now,
    })

    # Audit log
    mongo.db.audit_logs.insert_one({
        "action":    "project_approved",
        "actor_id":  g.user["_id"],
        "actor_role": "faculty",
        "target_id": oid,
        "target_type": "project",
        "details":   {"project_title": p["project_title"], "student_id": str(p["student_id"])},
        "created_at": now,
    })

    return jsonify({"message": "Request approved and bookings confirmed."})

# PATCH /api/faculty/requests/<id>/reject
@faculty_bp.route("/requests/<project_id>/reject", methods=["PATCH"])
@require_auth(roles=["faculty"])
def reject_request(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Request not found."}), 404
    if p["status"] not in ("submitted", "under_review"):
        return jsonify({"error": "Only submitted or under-review requests can be rejected."}), 400

    data         = request.get_json(silent=True) or {}
    faculty_notes = str(data.get("faculty_notes", "Rejected by faculty.")).strip()[:500]
    if not faculty_notes:
        return jsonify({"error": "A rejection reason (faculty_notes) is required."}), 400
    now = datetime.now(timezone.utc)

    # Cancel all pending_approval bookings linked to this project
    mongo.db.bookings.update_many(
        {"request_id": oid, "status": "pending_approval"},
        {"$set": {"status": "cancelled", "cancellation_reason": "Project request rejected.", "updated_at": now}}
    )

    mongo.db.projects.update_one(
        {"_id": oid},
        {"$set": {"status": "rejected", "faculty_notes": faculty_notes, "updated_at": now}}
    )

    # Notification
    mongo.db.notifications.insert_one({
        "user_id":   p["student_id"],
        "type":      "rejection",
        "title":     "Project Request Rejected",
        "message":   f'Your project "{p["project_title"]}" was not approved. Note: {faculty_notes}',
        "read":      False,
        "created_at": now,
    })

    # Audit log
    mongo.db.audit_logs.insert_one({
        "action":    "project_rejected",
        "actor_id":  g.user["_id"],
        "actor_role": "faculty",
        "target_id": oid,
        "target_type": "project",
        "details":   {"reason": faculty_notes, "student_id": str(p["student_id"])},
        "created_at": now,
    })

    return jsonify({"message": "Request rejected."})

# PATCH /api/faculty/requests/<id>/suggest
@faculty_bp.route("/requests/<project_id>/suggest", methods=["PATCH"])
@require_auth(roles=["faculty"])
def suggest_alternative(project_id):
    """Faculty suggests an alternative slot or equipment."""
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Request not found."}), 404

    data = request.get_json(silent=True) or {}
    suggestion = str(data.get("suggestion", "")).strip()[:500]
    if not suggestion:
        return jsonify({"error": "A suggestion message is required."}), 400
    now = datetime.now(timezone.utc)

    mongo.db.projects.update_one(
        {"_id": oid},
        {"$set": {"status": "under_review", "faculty_notes": suggestion, "updated_at": now}}
    )

    mongo.db.notifications.insert_one({
        "user_id":   p["student_id"],
        "type":      "suggestion",
        "title":     "Faculty Suggestion on Your Request",
        "message":   f'Faculty has a suggestion for "{p["project_title"]}": {suggestion}',
        "read":      False,
        "created_at": now,
    })

    return jsonify({"message": "Suggestion sent to student."})

# GET /api/faculty/bookings — faculty sees all confirmed/pending bookings
@faculty_bp.route("/bookings", methods=["GET"])
@require_auth(roles=["faculty"])
def faculty_bookings():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(20, int(request.args.get("per_page", 10)))
    skip     = (page - 1) * per_page
    status_filter = request.args.get("status")

    if status_filter:
        query = {"status": status_filter}
    else:
        query = {"status": {"$in": ["confirmed", "pending_approval"]}}

    total = mongo.db.bookings.count_documents(query)
    items = list(
        mongo.db.bookings.find(query)
        .sort("start_time", 1).skip(skip).limit(per_page)
    )
    return jsonify({
        "items": [serialize_booking(b) for b in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    })

# PATCH /api/faculty/bookings/<id>/approve — faculty approves a pending_approval booking
@faculty_bp.route("/bookings/<booking_id>/approve", methods=["PATCH"])
@require_auth(roles=["faculty"])
def approve_booking(booking_id):
    try:
        oid = ObjectId(booking_id)
    except Exception:
        return jsonify({"error": "Invalid booking ID."}), 400
    b = mongo.db.bookings.find_one({"_id": oid})
    if not b:
        return jsonify({"error": "Booking not found."}), 404
    if b["status"] != "pending_approval":
        return jsonify({"error": "Only pending_approval bookings can be approved."}), 400

    now = datetime.now(timezone.utc)
    mongo.db.bookings.update_one(
        {"_id": oid},
        {"$set": {
            "status": "confirmed",
            "approved_by": g.user["_id"],
            "approved_at": now,
            "updated_at": now,
        }}
    )
    # Notify the student
    mongo.db.notifications.insert_one({
        "user_id":   b["student_id"],
        "type":      "approval",
        "title":     "Booking Approved",
        "message":   f'Your booking for "{b.get("equipment_name", "equipment")}" has been approved.',
        "read":      False,
        "created_at": now,
    })
    mongo.db.audit_logs.insert_one({
        "action":     "booking_approved",
        "actor_id":   g.user["_id"],
        "actor_role": "faculty",
        "target_id":  oid,
        "target_type": "booking",
        "created_at": now,
    })
    return jsonify({"message": "Booking approved."})

# PATCH /api/faculty/bookings/<id>/reject — faculty rejects a pending_approval booking
@faculty_bp.route("/bookings/<booking_id>/reject", methods=["PATCH"])
@require_auth(roles=["faculty"])
def reject_booking(booking_id):
    try:
        oid = ObjectId(booking_id)
    except Exception:
        return jsonify({"error": "Invalid booking ID."}), 400
    b = mongo.db.bookings.find_one({"_id": oid})
    if not b:
        return jsonify({"error": "Booking not found."}), 404
    if b["status"] != "pending_approval":
        return jsonify({"error": "Only pending_approval bookings can be rejected."}), 400

    data   = request.get_json(silent=True) or {}
    reason = str(data.get("reason", "Rejected by faculty.")).strip()[:300]
    now = datetime.now(timezone.utc)
    mongo.db.bookings.update_one(
        {"_id": oid},
        {"$set": {
            "status": "cancelled",
            "cancellation_reason": reason,
            "updated_at": now,
        }}
    )
    mongo.db.notifications.insert_one({
        "user_id":   b["student_id"],
        "type":      "rejection",
        "title":     "Booking Rejected",
        "message":   f'Your booking for "{b.get("equipment_name", "equipment")}" was rejected. Reason: {reason}',
        "read":      False,
        "created_at": now,
    })
    return jsonify({"message": "Booking rejected."})
