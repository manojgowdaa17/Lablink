import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_faculty_requests_requires_auth(client):
    res = client.get("/api/faculty/requests")
    assert res.status_code == 401

def test_faculty_approve_requires_auth(client):
    res = client.patch("/api/faculty/requests/000000000000000000000000/approve", json={})
    assert res.status_code == 401

def test_admin_panel_requires_admin_cookie(client):
    res = client.get("/api/admin/panel/stats")
    assert res.status_code == 401

def test_admin_audit_logs_requires_auth(client):
    res = client.get("/api/admin/panel/audit-logs")
    assert res.status_code == 401
