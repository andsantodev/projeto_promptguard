from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_reports_ok() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["targetModel"]


def test_unknown_api_route_returns_404() -> None:
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
