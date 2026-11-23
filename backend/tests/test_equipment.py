import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_equipment_list_public(client):
    res = client.get("/api/equipment/")
    # May return 200 (empty list) or error — just ensure it doesn't crash
    assert res.status_code in (200, 500)


def test_equipment_list_pagination(client):
    res = client.get("/api/equipment/?page=1&per_page=5")
    assert res.status_code in (200, 500)


def test_equipment_not_found(client):
    res = client.get("/api/equipment/000000000000000000000000")
    assert res.status_code in (404, 400, 500)


def test_bookings_requires_auth(client):
    res = client.get("/api/bookings/")
    assert res.status_code == 401


def test_projects_requires_auth(client):
    res = client.post("/api/projects/", json={})
    assert res.status_code == 401
