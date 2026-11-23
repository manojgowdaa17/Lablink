from flask import Blueprint, request, jsonify, g
from ..extensions import mongo
from ..middleware.auth import require_auth
from bson import ObjectId
from datetime import datetime, timezone

projects_bp = Blueprint("projects", __name__)


def serialize_project(p):
    p["id"] = str(p.pop("_id"))
    p["student_id"] = str(p.get("student_id", ""))
    if isinstance(p.get("created_at"), datetime):
        p["created_at"] = p["created_at"].isoformat()
    if isinstance(p.get("updated_at"), datetime):
        p["updated_at"] = p["updated_at"].isoformat()
    if isinstance(p.get("preferred_start_date"), datetime):
        p["preferred_start_date"] = p["preferred_start_date"].isoformat()
    if isinstance(p.get("preferred_end_date"), datetime):
        p["preferred_end_date"] = p["preferred_end_date"].isoformat()
    if isinstance(p.get("deadline"), datetime):
        p["deadline"] = p["deadline"].isoformat()
    p["equipment_requested"] = [str(e) for e in p.get("equipment_requested", [])]
    return p


# POST /api/projects — submit a new project request
@projects_bp.route("/", methods=["POST"])
@require_auth(roles=["student"])
def create_project():
    data = request.get_json(silent=True) or {}
    title        = str(data.get("project_title", "")).strip()[:200]
    description  = str(data.get("project_description", "")).strip()[:2000]
    equipment    = data.get("equipment_requested", [])
    deadline_str = data.get("deadline", "")
    start_str    = data.get("preferred_start_date", "")
    end_str      = data.get("preferred_end_date", "")
    duration     = int(data.get("duration_hours", 2))

    if not title or not description:
        return jsonify({"error": "Project title and description are required."}), 400
    if len(description) < 50:
        return jsonify({"error": "Project description must be at least 50 characters."}), 400

    # Validate and coerce equipment IDs
    eq_ids = []
    for eid in equipment:
        try:
            eq_ids.append(ObjectId(eid))
        except Exception:
            pass

    # Parse dates
    def parse_date(s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s)
        except Exception:
            return None

    now = datetime.now(timezone.utc)
    doc = {
        "student_id":           g.user["_id"],
        "student_name":         g.user.get("name", ""),
        "project_title":        title,
        "project_description":  description,
        "equipment_requested":  eq_ids,
        "ai_recommendations":   [],
        "preferred_start_date": parse_date(start_str),
        "preferred_end_date":   parse_date(end_str),
        "deadline":             parse_date(deadline_str),
        "duration_hours":       max(1, min(duration, 72)),
        "status":               "submitted",
        "faculty_notes":        "",
        "created_at":           now,
        "updated_at":           now,
    }
    result = mongo.db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"message": "Project request submitted.", "project": serialize_project(doc)}), 201


# GET /api/projects — list current student's projects
@projects_bp.route("/", methods=["GET"])
@require_auth(roles=["student"])
def list_my_projects():
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(20, int(request.args.get("per_page", 10)))
    skip     = (page - 1) * per_page
    status   = request.args.get("status")

    query = {"student_id": g.user["_id"]}
    if status:
        query["status"] = status

    total = mongo.db.projects.count_documents(query)
    items = list(mongo.db.projects.find(query).sort("created_at", -1).skip(skip).limit(per_page))
    return jsonify({
        "items": [serialize_project(p) for p in items],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


# GET /api/projects/<id> — get single project detail
@projects_bp.route("/<project_id>", methods=["GET"])
@require_auth(roles=["student", "faculty"])
def get_project(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid})
    if not p:
        return jsonify({"error": "Project not found."}), 404
    # Students can only see their own projects
    if g.role == "student" and str(p["student_id"]) != str(g.user["_id"]):
        return jsonify({"error": "Access denied."}), 403
    return jsonify(serialize_project(p))


# PATCH /api/projects/<id>/cancel — student cancels a submitted project
@projects_bp.route("/<project_id>/cancel", methods=["PATCH"])
@require_auth(roles=["student"])
def cancel_project(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project ID."}), 400
    p = mongo.db.projects.find_one({"_id": oid, "student_id": g.user["_id"]})
    if not p:
        return jsonify({"error": "Project not found."}), 404
    if p["status"] not in ("submitted", "draft"):
        return jsonify({"error": "Cannot cancel a project that is under review or already processed."}), 400
    mongo.db.projects.update_one(
        {"_id": oid},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
    )
    return jsonify({"message": "Project request cancelled."})
