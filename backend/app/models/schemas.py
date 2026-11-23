"""
MongoDB collection schemas for LabLink.
These are reference structures, not enforced schemas.
All timestamps are stored as UTC datetime objects.
"""

EQUIPMENT_SCHEMA = {
    "name": str,                    # e.g. "NVIDIA DGX A100"
    "category": str,                # Computing | Electronics | Biotech | Mechanical | Other
    "department": str,              # Department name
    "lab_name": str,                # Lab room/building
    "lab_location": str,            # e.g. "Engineering Block B, Room 204"
    "short_description": str,
    "full_description": str,
    "specifications": dict,         # key-value pairs
    "status": str,                  # available | in-use | maintenance | retired
    "is_featured": bool,
    "access_level": str,            # open | restricted | supervised
    "image_url": str,
    "quantity": int,
    "available_quantity": int,
    "maintenance_schedule": list,   # list of {"start": datetime, "end": datetime, "note": str}
    "prerequisites": list,          # list of strings
    "created_at": "datetime",
    "updated_at": "datetime",
}

PROJECT_REQUEST_SCHEMA = {
    "student_id": "ObjectId",
    "student_name": str,
    "project_title": str,
    "project_description": str,
    "equipment_requested": list,    # list of equipment ObjectIds
    "ai_recommendations": list,     # list of {"equipment_id", "equipment_name", "reason", "confidence"}
    "preferred_start_date": "datetime",
    "preferred_end_date": "datetime",
    "deadline": "datetime",
    "duration_hours": int,
    "status": str,                  # draft | submitted | under_review | approved | rejected | cancelled
    "faculty_notes": str,
    "created_at": "datetime",
    "updated_at": "datetime",
}

BOOKING_SCHEMA = {
    "request_id": "ObjectId",
    "student_id": "ObjectId",
    "equipment_id": "ObjectId",
    "equipment_name": str,
    "start_time": "datetime",
    "end_time": "datetime",
    "status": str,                  # confirmed | cancelled | completed | no_show
    "checked_in_at": "datetime",
    "checked_out_at": "datetime",
    "qr_code_token": str,
    "approved_by": "ObjectId",      # faculty user_id
    "approved_at": "datetime",
    "cancellation_reason": str,
    "created_at": "datetime",
    "updated_at": "datetime",
}
