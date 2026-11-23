from flask import Blueprint, request, jsonify
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone

equipment_bp = Blueprint("equipment", __name__)


def serialize_equipment(eq):
    """Convert MongoDB doc to JSON-safe dict."""
    eq["id"] = str(eq.pop("_id"))
    if "maintenance_schedule" in eq:
        for m in eq["maintenance_schedule"]:
            if isinstance(m.get("start"), datetime):
                m["start"] = m["start"].isoformat()
            if isinstance(m.get("end"), datetime):
                m["end"] = m["end"].isoformat()
    return eq


# GET /api/equipment — public list with search/filter/pagination
@equipment_bp.route("/", methods=["GET"])
def list_equipment():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(20, int(request.args.get("per_page", 12)))
    skip     = (page - 1) * per_page

    query = {}
    search = request.args.get("search", "").strip()
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"department": {"$regex": search, "$options": "i"}},
            {"short_description": {"$regex": search, "$options": "i"}},
        ]
    if cat := request.args.get("category"):
        query["category"] = cat
    if dept := request.args.get("department"):
        query["department"] = {"$regex": dept, "$options": "i"}
    if status := request.args.get("status"):
        query["status"] = status

    total = mongo.db.equipment.count_documents(query)
    items = list(
        mongo.db.equipment.find(query, {"password_hash": 0})
        .sort("name", 1)
        .skip(skip)
        .limit(per_page)
    )
    return jsonify({
        "items": [serialize_equipment(e) for e in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


# GET /api/equipment/<id> — public single equipment detail
@equipment_bp.route("/<equipment_id>", methods=["GET"])
def get_equipment(equipment_id):
    try:
        oid = ObjectId(equipment_id)
    except Exception:
        return jsonify({"error": "Invalid equipment ID."}), 400
    eq = mongo.db.equipment.find_one({"_id": oid})
    if not eq:
        return jsonify({"error": "Equipment not found."}), 404
    return jsonify(serialize_equipment(eq))


# GET /api/equipment/<id>/availability — check availability for a date range
@equipment_bp.route("/<equipment_id>/availability", methods=["GET"])
def equipment_availability(equipment_id):
    try:
        oid = ObjectId(equipment_id)
    except Exception:
        return jsonify({"error": "Invalid equipment ID."}), 400
    eq = mongo.db.equipment.find_one({"_id": oid}, {"status": 1, "available_quantity": 1, "quantity": 1})
    if not eq:
        return jsonify({"error": "Equipment not found."}), 404

    start_str = request.args.get("start")
    end_str   = request.args.get("end")

    conflicts = []
    if start_str and end_str:
        try:
            start_dt = datetime.fromisoformat(start_str)
            end_dt   = datetime.fromisoformat(end_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use ISO 8601."}), 400

        # Find confirmed bookings that overlap with requested range
        conflicts = list(mongo.db.bookings.find(
            {
                "equipment_id": oid,
                "status": {"$in": ["confirmed"]},
                "start_time": {"$lt": end_dt},
                "end_time":   {"$gt": start_dt},
            },
            {"_id": 0, "start_time": 1, "end_time": 1}
        ))
        for c in conflicts:
            c["start_time"] = c["start_time"].isoformat()
            c["end_time"]   = c["end_time"].isoformat()

    return jsonify({
        "equipment_id": equipment_id,
        "status": eq.get("status", "unknown"),
        "total_quantity": eq.get("quantity", 1),
        "available_quantity": eq.get("available_quantity", 1),
        "has_conflicts": len(conflicts) > 0,
        "conflicts": conflicts,
    })


# GET /api/equipment/categories — get all unique categories
@equipment_bp.route("/categories", methods=["GET"])
def get_categories():
    cats = mongo.db.equipment.distinct("category")
    return jsonify({"categories": sorted(cats)})


# GET /api/equipment/departments — get all unique departments
@equipment_bp.route("/departments", methods=["GET"])
def get_departments():
    depts = mongo.db.equipment.distinct("department")
    return jsonify({"departments": sorted(depts)})
