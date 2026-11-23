from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone

waitlist_bp = Blueprint("waitlist", __name__)

@waitlist_bp.route("/", methods=["POST"])
@require_auth(roles=["student"])
def join_waitlist():
    data         = request.get_json(silent=True) or {}
    equipment_id = data.get("equipment_id", "")
    if not equipment_id:
        return jsonify({"error": "equipment_id is required."}), 400
    try:
        eq_oid = ObjectId(equipment_id)
    except Exception:
        return jsonify({"error": "Invalid equipment ID."}), 400

    eq = mongo.db.equipment.find_one({"_id": eq_oid})
    if not eq:
        return jsonify({"error": "Equipment not found."}), 404

    # Check already on waitlist
    existing = mongo.db.waitlist.find_one({
        "student_id": g.user["_id"], "equipment_id": eq_oid, "status": "waiting"
    })
    if existing:
        return jsonify({"error": "You are already on the waitlist for this equipment."}), 409

    now = datetime.now(timezone.utc)
    # Determine position
    position = mongo.db.waitlist.count_documents({"equipment_id": eq_oid, "status": "waiting"}) + 1
    result = mongo.db.waitlist.insert_one({
        "student_id":    g.user["_id"],
        "student_name":  g.user.get("name", ""),
        "equipment_id":  eq_oid,
        "equipment_name": eq.get("name", ""),
        "position":      position,
        "status":        "waiting",
        "created_at":    now,
    })
    return jsonify({
        "message": f"Added to waitlist at position {position}.",
        "waitlist_id": str(result.inserted_id),
        "position": position,
    }), 201

@waitlist_bp.route("/", methods=["GET"])
@require_auth(roles=["student"])
def my_waitlist():
    items = list(
        mongo.db.waitlist.find({"student_id": g.user["_id"], "status": "waiting"})
        .sort("created_at", -1)
    )
    for item in items:
        item["id"]           = str(item.pop("_id"))
        item["student_id"]   = str(item.get("student_id", ""))
        item["equipment_id"] = str(item.get("equipment_id", ""))
        if isinstance(item.get("created_at"), datetime):
            item["created_at"] = item["created_at"].isoformat()
    return jsonify({"waitlist": items})

@waitlist_bp.route("/<waitlist_id>/leave", methods=["PATCH"])
@require_auth(roles=["student"])
def leave_waitlist(waitlist_id):
    try:
        oid = ObjectId(waitlist_id)
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400
    mongo.db.waitlist.update_one(
        {"_id": oid, "student_id": g.user["_id"]},
        {"$set": {"status": "left"}}
    )
    return jsonify({"message": "Removed from waitlist."})
