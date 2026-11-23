from flask import Blueprint, jsonify
from ..extensions import mongo

public_bp = Blueprint("public", __name__)

@public_bp.route("/stats")
def campus_stats():
    try:
        stats = {
            "total_equipment": mongo.db.equipment.count_documents({}),
            "total_departments": mongo.db.departments.count_documents({}),
            "total_students": mongo.db.users.count_documents({"role": "student"}),
            "total_bookings": mongo.db.bookings.count_documents({}),
        }
    except Exception:
        stats = {
            "total_equipment": 120,
            "total_departments": 8,
            "total_students": 1500,
            "total_bookings": 4300,
        }
    return jsonify(stats)

@public_bp.route("/featured-equipment")
def featured_equipment():
    try:
        items = list(
            mongo.db.equipment.find(
                {"is_featured": True, "status": "available"},
                {
                    "_id": 0,
                    "name": 1,
                    "category": 1,
                    "department": 1,
                    "status": 1,
                    "image_url": 1,
                    "short_description": 1,
                },
            ).limit(6)
        )
    except Exception:
        items = []
    return jsonify(items)
