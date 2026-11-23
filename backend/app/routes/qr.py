from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone

qr_bp = Blueprint("qr", __name__)

@qr_bp.route("/checkin", methods=["POST"])
@require_auth(roles=["student"])
def qr_checkin():
    data  = request.get_json(silent=True) or {}
    token = str(data.get("qr_token", "")).strip()
    if not token:
        return jsonify({"error": "qr_token is required."}), 400

    now     = datetime.now(timezone.utc)
    booking = mongo.db.bookings.find_one({
        "qr_code_token": token,
        "student_id":    g.user["_id"],
        "status":        "confirmed",
    })
    if not booking:
        return jsonify({"error": "Invalid QR code or booking not found."}), 404
    if booking.get("checked_in_at"):
        return jsonify({"error": "Already checked in."}), 409
    if booking["start_time"] > now:
        return jsonify({"error": "Check-in not allowed before the session start time."}), 400

    mongo.db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"checked_in_at": now, "updated_at": now}}
    )
    return jsonify({
        "message": "Checked in successfully.",
        "equipment_name": booking.get("equipment_name", ""),
        "start_time": booking["start_time"].isoformat(),
        "end_time":   booking["end_time"].isoformat(),
    })

@qr_bp.route("/checkout", methods=["POST"])
@require_auth(roles=["student"])
def qr_checkout():
    data  = request.get_json(silent=True) or {}
    token = str(data.get("qr_token", "")).strip()
    if not token:
        return jsonify({"error": "qr_token is required."}), 400

    now     = datetime.now(timezone.utc)
    booking = mongo.db.bookings.find_one({
        "qr_code_token": token,
        "student_id":    g.user["_id"],
        "status":        "confirmed",
    })
    if not booking:
        return jsonify({"error": "Invalid QR code or booking not found."}), 404
    if not booking.get("checked_in_at"):
        return jsonify({"error": "Must check in before checking out."}), 400
    if booking.get("checked_out_at"):
        return jsonify({"error": "Already checked out."}), 409

    mongo.db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"checked_out_at": now, "status": "completed", "updated_at": now}}
    )
    # Log usage history
    mongo.db.usage_history.insert_one({
        "booking_id":    booking["_id"],
        "student_id":    booking["student_id"],
        "equipment_id":  booking["equipment_id"],
        "equipment_name": booking.get("equipment_name", ""),
        "checked_in_at":  booking["checked_in_at"],
        "checked_out_at": now,
        "duration_minutes": int((now - booking["checked_in_at"]).total_seconds() / 60),
        "created_at": now,
    })
    return jsonify({
        "message": "Checked out successfully. Session completed.",
        "equipment_name": booking.get("equipment_name", ""),
        "duration_minutes": int((now - booking["checked_in_at"]).total_seconds() / 60),
    })
