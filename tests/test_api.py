import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app



client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "docs" in response.json()


def test_payment_config():
    response = client.get("/api/v1/payments/config")
    assert response.status_code == 200
    assert "publishable_key" in response.json()


def test_chat_agronomist_fallback():
    response = client.post(
        "/api/v1/chat/message",
        json={"content": "What is the best fungicide for potato Late Blight?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert len(data["content"]) > 10

