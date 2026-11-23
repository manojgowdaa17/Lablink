from ..extensions import mongo


def create_indexes():
    """Create all required MongoDB indexes."""
    # users
    mongo.db.users.create_index("email", unique=True)
    mongo.db.users.create_index("role")
    # admin_users
    mongo.db.admin_users.create_index("email", unique=True)
    # equipment
    mongo.db.equipment.create_index("category")
    mongo.db.equipment.create_index("department")
    mongo.db.equipment.create_index("status")
    mongo.db.equipment.create_index([("name", "text"), ("short_description", "text")])
    # projects
    mongo.db.projects.create_index("student_id")
    mongo.db.projects.create_index("status")
    mongo.db.projects.create_index("created_at")
    # bookings
    mongo.db.bookings.create_index("student_id")
    mongo.db.bookings.create_index("equipment_id")
    mongo.db.bookings.create_index("status")
    mongo.db.bookings.create_index([("equipment_id", 1), ("status", 1), ("start_time", 1), ("end_time", 1)])
    # user_sessions
    mongo.db.user_sessions.create_index("token", unique=True)
    mongo.db.user_sessions.create_index("user_id")
    mongo.db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    # audit_logs
    mongo.db.audit_logs.create_index("user_id")
    mongo.db.audit_logs.create_index("created_at")
