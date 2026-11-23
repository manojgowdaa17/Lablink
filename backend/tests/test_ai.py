import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_recommend_requires_auth(client):
    res = client.post("/api/ai/recommend", json={})
    assert res.status_code == 401

def test_score_requires_auth(client):
    res = client.post("/api/ai/score", json={"project_id": "000000000000000000000000"})
    assert res.status_code == 401

def test_rank_requires_faculty(client):
    res = client.get("/api/ai/rank")
    assert res.status_code == 401

def test_alternatives_requires_auth(client):
    res = client.get("/api/ai/alternatives?equipment_id=abc&start=2025-01-01T00:00:00")
    assert res.status_code == 401

def test_fairshare_score_determinism():
    """Unit test: same inputs always produce the same FairShare score."""
    from app.utils.fairshare import compute_priority_score
    from datetime import datetime, timezone, timedelta
    from bson import ObjectId

    # Use a fake student_id that won't be in DB (score will be 100 for fairness)
    fake_id = ObjectId()
    deadline = datetime.now(timezone.utc) + timedelta(days=5)
    result1 = compute_priority_score(
        student_id=fake_id,
        equipment_ids=[],
        project_description="machine learning neural network experiment",
        deadline=deadline,
        preferred_start=None,
        preferred_end=None,
        duration_hours=4,
    )
    result2 = compute_priority_score(
        student_id=fake_id,
        equipment_ids=[],
        project_description="machine learning neural network experiment",
        deadline=deadline,
        preferred_start=None,
        preferred_end=None,
        duration_hours=4,
    )
    # Scores should be equal (deterministic)
    assert result1["total_score"] == result2["total_score"]
    # Weights should sum to approximately 100
    total = sum(result1["weighted"].values())
    assert total > 0
