import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)

def hash_password(plain: str) -> str:
    return ph.hash(plain)

def verify_password(hashed: str, plain: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False
    except Exception:
        return False

def generate_session_token() -> str:
    return secrets.token_hex(48)
