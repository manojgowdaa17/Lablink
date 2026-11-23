import re

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
ROLL_RE  = re.compile(r'^[A-Z0-9]{4,20}$')

def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email.strip()))

def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit."
    return True, ""

def validate_roll_number(roll: str) -> bool:
    return bool(ROLL_RE.match(roll.strip().upper()))

def sanitize_string(s: str, max_len: int = 200) -> str:
    """Strip leading/trailing whitespace, limit length."""
    return str(s).strip()[:max_len]
