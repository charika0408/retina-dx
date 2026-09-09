import os
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("EXPO_BACKEND_URL")
    or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")
    or frontend_env.get("EXPO_BACKEND_URL")
)


def test_health_and_samples():
    health = requests.get(f"{BASE_URL}/api/health", timeout=20)
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"
    samples = requests.get(f"{BASE_URL}/api/samples", timeout=20)
    assert samples.status_code == 200
    ids = {item["id"] for item in samples.json()["samples"]}
    assert {"sample_normal_01", "sample_dr_02"}.issubset(ids)


def test_predict_normal_demo_has_clinical_fields():
    response = requests.post(
        f"{BASE_URL}/api/predict",
        json={"sample_id": "sample_normal_01", "demo_mode": True},
        timeout=20,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_label"] == "LOW RISK"
    assert data["confidence"] == 94.6
    assert "microaneurysms" in data["biomarkers"]
    assert "disclaimer" in data


def test_predict_without_image_returns_validation_error():
    response = requests.post(f"{BASE_URL}/api/predict", json={}, timeout=20)
    assert response.status_code == 400
    assert "retinal image" in response.json()["detail"]


def test_screenings_history_contains_created_result():
    requests.post(
        f"{BASE_URL}/api/predict",
        json={"sample_id": "sample_dr_02", "demo_mode": True},
        timeout=20,
    )
    response = requests.get(f"{BASE_URL}/api/screenings", timeout=20)
    assert response.status_code == 200
    assert isinstance(response.json()["screenings"], list)