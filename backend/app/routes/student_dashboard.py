from flask import Blueprint, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from datetime import datetime, timezone

student_dashboard_bp = Blueprint("student_dashboard", __name__)


@student_dashboard_bp.route("/stats", methods=["GET"])
@require_auth(roles=["student"])
def student_stats():
    uid = g.user["_id"]
    now = datetime.now(timezone.utc)
    stats = {
        "active_bookings":      mongo.db.bookings.count_documents({"student_id": uid, "status": "confirmed", "end_time": {"$gt": now}}),
        "pending_requests":     mongo.db.projects.count_documents({"student_id": uid, "status": {"$in": ["submitted", "under_review"]}}),
        "total_equipment_used": mongo.db.bookings.count_documents({"student_id": uid, "status": "completed"}),
        "upcoming_sessions":    mongo.db.bookings.count_documents({"student_id": uid, "status": "confirmed", "start_time": {"$gt": now}}),
    }
    return jsonify(stats)


@student_dashboard_bp.route("/recent-activity", methods=["GET"])
@require_auth(roles=["student"])
def recent_activity():
    uid = g.user["_id"]
    bookings = list(
        mongo.db.bookings.find(
            {"student_id": uid},
            {"equipment_name": 1, "status": 1, "start_time": 1, "end_time": 1}
        ).sort("created_at", -1).limit(5)
    )
    for b in bookings:
        b["id"] = str(b.pop("_id"))
        if isinstance(b.get("start_time"), datetime):
            b["start_time"] = b["start_time"].isoformat()
        if isinstance(b.get("end_time"), datetime):
            b["end_time"] = b["end_time"].isoformat()
    return jsonify({"activity": bookings})
