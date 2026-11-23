from flask import Blueprint, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/", methods=["GET"])
@require_auth(roles=["student", "faculty"])
def list_notifications():
    uid = g.user["_id"]
    notes = list(
        mongo.db.notifications.find({"user_id": uid})
        .sort("created_at", -1).limit(20)
    )
    for n in notes:
        n["id"] = str(n.pop("_id"))
        n["user_id"] = str(n.get("user_id", ""))
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    unread = sum(1 for n in notes if not n.get("read", False))
    return jsonify({"notifications": notes, "unread": unread})

@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@require_auth(roles=["student", "faculty"])
def mark_read(notification_id):
    try:
        oid = ObjectId(notification_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    mongo.db.notifications.update_one(
        {"_id": oid, "user_id": g.user["_id"]},
        {"$set": {"read": True}}
    )
    return jsonify({"message": "Marked as read."})

@notifications_bp.route("/read-all", methods=["PATCH"])
@require_auth(roles=["student", "faculty"])
def mark_all_read():
    mongo.db.notifications.update_many(
        {"user_id": g.user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    return jsonify({"message": "All notifications marked as read."})
