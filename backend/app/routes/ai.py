from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from ..utils.gemini_client import analyze_project_for_equipment, explain_fairshare_decision
from ..utils.fairshare import compute_priority_score, find_alternative_slots, rank_requests
from bson import ObjectId
from datetime import datetime

ai_bp = Blueprint("ai", __name__)


def _serialize_eq(eq) -> dict:
    return {
        "id":                str(eq["_id"]),
        "name":              eq.get("name", ""),
        "category":          eq.get("category", ""),
        "department":        eq.get("department", ""),
        "status":            eq.get("status", ""),
        "short_description": eq.get("short_description", ""),
    }


# POST /api/ai/recommend
# Student submits project text → Gemini recommends equipment
@ai_bp.route("/recommend", methods=["POST"])
@require_auth(roles=["student"])
def recommend_equipment():
    data        = request.get_json(silent=True) or {}
    title       = str(data.get("project_title", "")).strip()
    description = str(data.get("project_description", "")).strip()

    if not title or not description:
        return jsonify({"error": "project_title and project_description are required."}), 400
    if len(description) < 30:
        return jsonify({"error": "Description must be at least 30 characters."}), 400

    # Fetch all available equipment for context
    equipment = list(mongo.db.equipment.find(
        {"status": {"$in": ["available", "in-use"]}},
        {"name": 1, "category": 1, "department": 1, "status": 1, "short_description": 1}
    ).limit(50))
    eq_list = [_serialize_eq(e) for e in equipment]

    # If DB is empty, return informative fallback
    if not eq_list:
        return jsonify({
            "recommendations": [],
            "prerequisites": [],
            "summary": "No equipment is currently registered in the database. Please contact your administrator.",
            "ai_available": False,
        })

    result = analyze_project_for_equipment(title, description, eq_list)
    return jsonify(result)


# POST /api/ai/score — compute FairShare score for a project request
@ai_bp.route("/score", methods=["POST"])
@require_auth(roles=["student", "faculty"])
def score_project():
    data        = request.get_json(silent=True) or {}
    project_id  = data.get("project_id", "")

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project ID."}), 400

    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Project not found."}), 404

    # Students can only score their own projects
    if g.role == "student" and str(p["student_id"]) != str(g.user["_id"]):
        return jsonify({"error": "Access denied."}), 403

    score_data = compute_priority_score(
        student_id=p["student_id"],
        equipment_ids=p.get("equipment_requested", []),
        project_description=p.get("project_description", ""),
        deadline=p.get("deadline"),
        preferred_start=p.get("preferred_start_date"),
        preferred_end=p.get("preferred_end_date"),
        duration_hours=p.get("duration_hours", 2),
    )

    # Optionally get Gemini explanation
    explanation = explain_fairshare_decision(
        project_title=p.get("project_title", ""),
        score=score_data["total_score"],
        score_breakdown=score_data["breakdown"],
    )

    return jsonify({
        "project_id":    str(p["_id"]),
        "project_title": p.get("project_title", ""),
        "score":         score_data,
        "explanation":   explanation,
    })


# GET /api/ai/rank — faculty/admin rank all submitted requests by FairShare
@ai_bp.route("/rank", methods=["GET"])
@require_auth(roles=["faculty"])
def rank_all_requests():
    # Get all submitted projects
    projects = list(mongo.db.projects.find(
        {"status": {"$in": ["submitted", "under_review"]}},
        {"_id": 1}
    ))
    project_ids = [str(p["_id"]) for p in projects]
    ranked = rank_requests(project_ids)
    return jsonify({"ranked": ranked, "total": len(ranked)})


# GET /api/ai/alternatives — find alternative slots for equipment
@ai_bp.route("/alternatives", methods=["GET"])
@require_auth(roles=["student"])
def alternative_slots():
    equipment_id = request.args.get("equipment_id", "")
    start_str    = request.args.get("start", "")
    duration     = int(request.args.get("duration_hours", 2))

    if not equipment_id or not start_str:
        return jsonify({"error": "equipment_id and start are required."}), 400
    try:
        eq_oid   = ObjectId(equipment_id)
        start_dt = datetime.fromisoformat(start_str)
    except Exception:
        return jsonify({"error": "Invalid equipment ID or date format."}), 400

    from datetime import timedelta
    end_dt = start_dt + timedelta(hours=duration)
    slots  = find_alternative_slots(eq_oid, start_dt, end_dt, duration)
    return jsonify({"alternatives": slots})


# POST /api/ai/save-recommendations — save AI recommendations to a project
@ai_bp.route("/save-recommendations", methods=["POST"])
@require_auth(roles=["student"])
def save_recommendations():
    data            = request.get_json(silent=True) or {}
    project_id      = data.get("project_id", "")
    recommendations = data.get("recommendations", [])

    if not project_id:
        return jsonify({"error": "project_id is required."}), 400
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project ID."}), 400

    p = mongo.db.projects.find_one({"_id": oid, "student_id": g.user["_id"]})
    if not p:
        return jsonify({"error": "Project not found."}), 404

    mongo.db.projects.update_one(
        {"_id": oid},
        {"$set": {"ai_recommendations": recommendations, "updated_at": datetime.now()}}
    )
    return jsonify({"message": "AI recommendations saved to project."})
