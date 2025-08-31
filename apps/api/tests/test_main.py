"""Tests for main API module"""

from fastapi.testclient import TestClient

from agent_quant_api.main import app

client = TestClient(app)


def test_read_root() -> None:
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}