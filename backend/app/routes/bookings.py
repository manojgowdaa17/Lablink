from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone
import secrets

bookings_bp = Blueprint("bookings", __name__)


def serialize_booking(b):
    b["id"] = str(b.pop("_id"))
    b["student_id"]   = str(b.get("student_id", ""))
    b["equipment_id"] = str(b.get("equipment_id", ""))
    b["request_id"]   = str(b.get("request_id", "")) if b.get("request_id") else None
    b["approved_by"]  = str(b.get("approved_by", "")) if b.get("approved_by") else None
    for field in ["start_time", "end_time", "approved_at", "created_at", "updated_at", "checked_in_at", "checked_out_at"]:
        if isinstance(b.get(field), datetime):
            b[field] = b[field].isoformat()
    return b


def check_booking_conflict(equipment_id: ObjectId, start_dt: datetime, end_dt: datetime, exclude_id=None) -> bool:
    """Returns True if there is a confirmed booking overlapping the given range."""
    query = {
        "equipment_id": equipment_id,
        "status": "confirmed",
        "start_time": {"$lt": end_dt},
        "end_time":   {"$gt": start_dt},
    }
    if exclude_id:
        query["_id"] = {"$ne": exclude_id}
    return mongo.db.bookings.count_documents(query) > 0


# POST /api/bookings — create a booking (after faculty approval, or directly for open-access equipment)
@bookings_bp.route("/", methods=["POST"])
@require_auth(roles=["student"])
def create_booking():
    data         = request.get_json(silent=True) or {}
    equipment_id = data.get("equipment_id", "")
    start_str    = data.get("start_time", "")
    end_str      = data.get("end_time", "")
    request_id   = data.get("request_id")  # optional — links to a project request

    if not equipment_id or not start_str or not end_str:
        return jsonify({"error": "equipment_id, start_time and end_time are required."}), 400

    try:
        eq_oid   = ObjectId(equipment_id)
        start_dt = datetime.fromisoformat(start_str)
        end_dt   = datetime.fromisoformat(end_str)
    except Exception:
        return jsonify({"error": "Invalid equipment ID or date format (use ISO 8601)."}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "end_time must be after start_time."}), 400
    if (end_dt - start_dt).total_seconds() > 72 * 3600:
        return jsonify({"error": "Booking duration cannot exceed 72 hours."}), 400

    eq = mongo.db.equipment.find_one({"_id": eq_oid})
    if not eq:
        return jsonify({"error": "Equipment not found."}), 404
    if eq.get("status") == "maintenance":
        return jsonify({"error": "Equipment is currently under maintenance."}), 409
    if eq.get("status") == "retired":
        return jsonify({"error": "Equipment has been retired."}), 409

    # Conflict detection
    if check_booking_conflict(eq_oid, start_dt, end_dt):
        # Find next available slot suggestion
        last_booking = mongo.db.bookings.find_one(
            {"equipment_id": eq_oid, "status": "confirmed", "start_time": {"$gte": start_dt}},
            sort=[("end_time", 1)]
        )
        suggestion = last_booking["end_time"].isoformat() if last_booking else None
        return jsonify({
            "error": "This time slot is already booked.",
            "suggested_start": suggestion,
        }), 409

    req_oid = None
    if request_id:
        try:
            req_oid = ObjectId(request_id)
        except Exception:
            pass

    now = datetime.now(timezone.utc)
    # Open-access equipment → auto-confirmed; restricted → pending approval
    initial_status = "confirmed" if eq.get("access_level") == "open" else "pending_approval"

    doc = {
        "request_id":          req_oid,
        "student_id":          g.user["_id"],
        "equipment_id":        eq_oid,
        "equipment_name":      eq.get("name", ""),
        "start_time":          start_dt,
        "end_time":            end_dt,
        "status":              initial_status,
        "checked_in_at":       None,
        "checked_out_at":      None,
        "qr_code_token":       secrets.token_urlsafe(32),
        "approved_by":         None,
        "approved_at":         None,
        "cancellation_reason": None,
        "created_at":          now,
        "updated_at":          now,
    }
    result = mongo.db.bookings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"message": "Booking created.", "booking": serialize_booking(doc)}), 201


# GET /api/bookings — list current student's bookings
@bookings_bp.route("/", methods=["GET"])
@require_auth(roles=["student"])
def list_my_bookings():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(20, int(request.args.get("per_page", 10)))
    skip     = (page - 1) * per_page
    status   = request.args.get("status")

    query = {"student_id": g.user["_id"]}
    if status:
        query["status"] = status

    total = mongo.db.bookings.count_documents(query)
    items = list(mongo.db.bookings.find(query).sort("start_time", -1).skip(skip).limit(per_page))
    return jsonify({
        "items": [serialize_booking(b) for b in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


# GET /api/bookings/<id> — get single booking
@bookings_bp.route("/<booking_id>", methods=["GET"])
@require_auth(roles=["student", "faculty"])
def get_booking(booking_id):
    try:
        oid = ObjectId(booking_id)
    except Exception:
        return jsonify({"error": "Invalid booking ID."}), 400
    b = mongo.db.bookings.find_one({"_id": oid})
    if not b:
        return jsonify({"error": "Booking not found."}), 404
    if g.role == "student" and str(b["student_id"]) != str(g.user["_id"]):
        return jsonify({"error": "Access denied."}), 403
    return jsonify(serialize_booking(b))


# PATCH /api/bookings/<id>/cancel — student cancels a booking
@bookings_bp.route("/<booking_id>/cancel", methods=["PATCH"])
@require_auth(roles=["student"])
def cancel_booking(booking_id):
    try:
        oid = ObjectId(booking_id)
    except Exception:
        return jsonify({"error": "Invalid booking ID."}), 400
    b = mongo.db.bookings.find_one({"_id": oid, "student_id": g.user["_id"]})
    if not b:
        return jsonify({"error": "Booking not found."}), 404
    if b["status"] not in ("confirmed", "pending_approval"):
        return jsonify({"error": "Only confirmed or pending bookings can be cancelled."}), 400

    data   = request.get_json(silent=True) or {}
    reason = str(data.get("reason", "Cancelled by student"))[:300]

    now = datetime.now(timezone.utc)
    # Prevent last-minute cancellations (within 1 hour)
    if b["status"] == "confirmed" and b["start_time"] < now:
        return jsonify({"error": "Cannot cancel a booking that has already started."}), 400

    mongo.db.bookings.update_one(
        {"_id": oid},
        {"$set": {"status": "cancelled", "cancellation_reason": reason, "updated_at": now}}
    )
    return jsonify({"message": "Booking cancelled."})
