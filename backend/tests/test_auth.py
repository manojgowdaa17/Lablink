import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200

def test_register_missing_fields(client):
    res = client.post("/api/auth/register", json={})
    assert res.status_code == 400

def test_register_invalid_email(client):
    res = client.post("/api/auth/register", json={
        "name": "Test User", "email": "not-an-email",
        "role": "student", "password": "Password1", "roll_number": "CS001"
    })
    assert res.status_code == 400

def test_login_nonexistent_user(client):
    res = client.post("/api/auth/login", json={
        "email": "ghost@test.com", "password": "Password1"
    })
    assert res.status_code == 401
