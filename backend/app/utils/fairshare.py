"""
FairShare Allocation Engine for LabLink.

Weighted priority scoring:
  - Deadline urgency:      40%
  - Equipment necessity:   25%
  - Fairness (usage history): 20%
  - Availability feasibility: 15%

Rules:
  - Scores are deterministic: same inputs → same score.
  - Gemini MAY explain but NEVER decides allocation.
  - No overlapping confirmed bookings are ever allowed.
  - Returns detailed breakdown for transparency.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from ..extensions import mongo
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

WEIGHTS = {
    "deadline_urgency":       0.40,
    "equipment_necessity":    0.25,
    "fairness":               0.20,
    "availability_feasibility": 0.15,
}


def _deadline_urgency_score(deadline: Optional[datetime], now: datetime) -> float:
    """
    Score 0–100 based on how soon the deadline is.
    - <= 1 day:   100
    - <= 3 days:   85
    - <= 7 days:   70
    - <= 14 days:  50
    - <= 30 days:  30
    - > 30 days:   10
    - No deadline: 20
    """
    if deadline is None:
        return 20.0
    delta = (deadline - now).total_seconds() / 86400  # days
    if delta <= 0:
        return 100.0
    if delta <= 1:
        return 100.0
    if delta <= 3:
        return 85.0
    if delta <= 7:
        return 70.0
    if delta <= 14:
        return 50.0
    if delta <= 30:
        return 30.0
    return 10.0


def _equipment_necessity_score(equipment_ids: list, project_description: str) -> float:
    """
    Score 0–100 based on number of equipment items requested
    and whether description mentions specific technical terms.
    """
    count = len(equipment_ids)
    if count == 0:
        return 10.0
    base = min(60.0, count * 15.0)  # up to 60 for quantity
    # Bonus for technical depth in description
    technical_keywords = [
        "neural network", "machine learning", "deep learning", "circuit", "oscilloscope",
        "pcr", "microscope", "robot", "3d print", "fpga", "microcontroller", "sensor",
        "spectroscopy", "simulation", "analysis", "prototype", "fabricat", "experiment",
    ]
    desc_lower = project_description.lower()
    matches = sum(1 for kw in technical_keywords if kw in desc_lower)
    keyword_bonus = min(40.0, matches * 8.0)
    return min(100.0, base + keyword_bonus)


def _fairness_score(student_id, now: datetime) -> float:
    """
    Score 0–100. Students who have used less equipment recently score higher (more fair).
    Look at bookings in the past 30 days.
    """
    thirty_days_ago = now - timedelta(days=30)
    recent_bookings = mongo.db.bookings.count_documents({
        "student_id": student_id,
        "status": {"$in": ["confirmed", "completed"]},
        "created_at": {"$gte": thirty_days_ago},
    })
    # Inverse scale: 0 bookings → 100, 10+ bookings → 10
    score = max(10.0, 100.0 - (recent_bookings * 9.0))
    return score


def _availability_feasibility_score(
    equipment_ids: list,
    preferred_start: Optional[datetime],
    preferred_end: Optional[datetime],
    duration_hours: int,
) -> float:
    """
    Score 0–100 based on whether the requested equipment + time slot is feasible.
    """
    if not equipment_ids:
        return 50.0

    if preferred_start is None or preferred_end is None:
        # No time specified — check equipment availability only
        available_count = 0
        for eid in equipment_ids:
            eq = mongo.db.equipment.find_one({"_id": eid}, {"status": 1})
            if eq and eq.get("status") == "available":
                available_count += 1
        return (available_count / len(equipment_ids)) * 100.0

    # Check conflicts for the requested window
    conflict_count = 0
    for eid in equipment_ids:
        conflicts = mongo.db.bookings.count_documents({
            "equipment_id": eid,
            "status": "confirmed",
            "start_time": {"$lt": preferred_end},
            "end_time":   {"$gt": preferred_start},
        })
        if conflicts > 0:
            conflict_count += 1

    conflict_ratio = conflict_count / len(equipment_ids)
    return max(10.0, (1.0 - conflict_ratio) * 100.0)


def compute_priority_score(
    student_id,
    equipment_ids: list,
    project_description: str,
    deadline: Optional[datetime],
    preferred_start: Optional[datetime],
    preferred_end: Optional[datetime],
    duration_hours: int = 2,
) -> dict:
    """
    Compute FairShare priority score for a project request.

    Returns:
        {
            "total_score": float,          # 0–100
            "breakdown": {
                "deadline_urgency": float,
                "equipment_necessity": float,
                "fairness": float,
                "availability_feasibility": float,
            },
            "weighted": {
                "deadline_urgency": float,
                "equipment_necessity": float,
                "fairness": float,
                "availability_feasibility": float,
            },
        }
    """
    now = datetime.now(timezone.utc)

    raw = {
        "deadline_urgency":         _deadline_urgency_score(deadline, now),
        "equipment_necessity":      _equipment_necessity_score(equipment_ids, project_description),
        "fairness":                 _fairness_score(student_id, now),
        "availability_feasibility": _availability_feasibility_score(
            equipment_ids, preferred_start, preferred_end, duration_hours
        ),
    }

    weighted = {k: raw[k] * WEIGHTS[k] for k in raw}
    total    = sum(weighted.values())

    return {
        "total_score": round(total, 2),
        "breakdown":   {k: round(v, 2) for k, v in raw.items()},
        "weighted":    {k: round(v, 2) for k, v in weighted.items()},
    }


def find_alternative_slots(
    equipment_id,
    preferred_start: datetime,
    preferred_end: datetime,
    duration_hours: int = 2,
    max_suggestions: int = 3,
) -> list[dict]:
    """
    Find up to `max_suggestions` alternative available slots for equipment
    starting from preferred_start, looking ahead 14 days.
    Returns list of {"start": isoformat, "end": isoformat}.
    """
    slots = []
    duration = timedelta(hours=duration_hours)
    # Find all confirmed bookings for this equipment in the next 14 days
    lookahead_end = preferred_start + timedelta(days=14)
    bookings = list(mongo.db.bookings.find(
        {
            "equipment_id": equipment_id,
            "status": "confirmed",
            "start_time": {"$gte": preferred_start},
            "end_time":   {"$lte": lookahead_end},
        },
        {"start_time": 1, "end_time": 1},
    ).sort("start_time", 1))

    # Try slots after each booking's end time
    candidate = preferred_start
    for b in bookings:
        if candidate + duration <= b["start_time"]:
            # Gap before this booking
            slots.append({
                "start": candidate.isoformat(),
                "end":   (candidate + duration).isoformat(),
            })
            if len(slots) >= max_suggestions:
                break
        # Move candidate to after this booking
        candidate = b["end_time"]

    # If still need more, try after the last booking
    if len(slots) < max_suggestions:
        slots.append({
            "start": candidate.isoformat(),
            "end":   (candidate + duration).isoformat(),
        })

    return slots[:max_suggestions]


def rank_requests(project_ids: list[str]) -> list[dict]:
    """
    Rank a list of project request IDs by FairShare priority score.
    Returns sorted list of {project_id, project_title, total_score, breakdown}.
    """
    results = []
    for pid in project_ids:
        try:
            oid = ObjectId(pid)
        except Exception:
            continue
        p = mongo.db.projects.find_one({"_id": oid})
        if not p:
            continue
        eq_ids = p.get("equipment_requested", [])
        score_data = compute_priority_score(
            student_id=p["student_id"],
            equipment_ids=eq_ids,
            project_description=p.get("project_description", ""),
            deadline=p.get("deadline"),
            preferred_start=p.get("preferred_start_date"),
            preferred_end=p.get("preferred_end_date"),
            duration_hours=p.get("duration_hours", 2),
        )
        results.append({
            "project_id":    str(p["_id"]),
            "project_title": p.get("project_title", ""),
            "student_name":  p.get("student_name", ""),
            "total_score":   score_data["total_score"],
            "breakdown":     score_data["breakdown"],
            "weighted":      score_data["weighted"],
        })

    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results
