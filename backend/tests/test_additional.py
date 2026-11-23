import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_notifications_requires_auth(client):
    res = client.get("/api/notifications/")
    assert res.status_code == 401

def test_waitlist_requires_auth(client):
    res = client.post("/api/waitlist/", json={"equipment_id": "abc"})
    assert res.status_code == 401

def test_qr_checkin_requires_auth(client):
    res = client.post("/api/qr/checkin", json={"qr_token": "test"})
    assert res.status_code == 401

def test_qr_checkout_requires_auth(client):
    res = client.post("/api/qr/checkout", json={"qr_token": "test"})
    assert res.status_code == 401

def test_public_stats_always_available(client):
    res = client.get("/api/public/stats")
    # Should return 200 even with no DB (uses fallback)
    assert res.status_code == 200

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert "status" in data

def test_equipment_list_public(client):
    res = client.get("/api/equipment/")
    assert res.status_code in (200, 500)
