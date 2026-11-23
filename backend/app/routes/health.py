from flask import Blueprint, jsonify
from ..extensions import mongo

health_bp = Blueprint("health", __name__)

@health_bp.route("/health")
def health_check():
    try:
        mongo.db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return jsonify({"status": "ok", "database": db_status})
