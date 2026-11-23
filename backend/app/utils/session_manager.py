from datetime import datetime, timezone, timedelta
from ..extensions import mongo
from .security import generate_session_token

SESSION_TTL_HOURS = 8

def create_session(user_id, role: str, ip: str, user_agent: str) -> str:
    token = generate_session_token()
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(hours=SESSION_TTL_HOURS)
    mongo.db.user_sessions.insert_one({
        "token": token,
        "user_id": user_id,
        "role": role,
        "ip_address": ip,
        "user_agent": user_agent,
        "created_at": now,
        "last_active": now,
        "status": "active",
        "expires_at": expiry,
    })
    return token

def get_session(token: str):
    now = datetime.now(timezone.utc)
    session = mongo.db.user_sessions.find_one({"token": token, "status": "active"})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if expires_at:
        # MongoDB may return naive datetimes — make timezone-aware before comparing
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            mongo.db.user_sessions.update_one(
                {"token": token}, {"$set": {"status": "expired"}}
            )
            return None
    mongo.db.user_sessions.update_one(
        {"token": token}, {"$set": {"last_active": now}}
    )
    return session

def revoke_session(token: str):
    mongo.db.user_sessions.update_one(
        {"token": token},
        {"$set": {"status": "revoked", "revoked_at": datetime.now(timezone.utc)}}
    )
