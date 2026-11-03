from fastapi.testclient import TestClient

from backend.main import app
from backend.services.security_headers import SECURITY_HEADERS

client = TestClient(app)


def test_api_responses_carry_security_headers() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    for name, value in SECURITY_HEADERS.items():
        assert response.headers[name] == value


def test_error_responses_carry_security_headers() -> None:
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    for name, value in SECURITY_HEADERS.items():
        assert response.headers[name] == value
