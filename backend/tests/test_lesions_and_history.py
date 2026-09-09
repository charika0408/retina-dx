"""Tests for new Lesion Heatmap feature added to /api/predict.

Validates:
- Deterministic lesion array for sample_dr_02 (has microaneurysm+exudate+hemorrhage)
- Empty lesions for sample_normal_01
- Only microaneurysm lesions for sample_dr_mild_03
- GET /api/screenings records include lesions field
"""
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

VALID_TYPES = {"microaneurysm", "exudate", "hemorrhage"}


def _predict(sample_id: str) -> dict:
    resp = requests.post(
        f"{BASE_URL}/api/predict",
        json={"sample_id": sample_id, "demo_mode": True},
        timeout=25,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_dr_02_lesions_nonempty_and_wellformed():
    data = _predict("sample_dr_02")
    lesions = data.get("lesions")
    assert isinstance(lesions, list) and len(lesions) > 0, "Expected non-empty lesions for sample_dr_02"
    types_seen = set()
    for l in lesions:
        assert l["type"] in VALID_TYPES
        assert 0.0 <= l["x"] <= 1.0
        assert 0.0 <= l["y"] <= 1.0
        assert 0.0 < l["radius"] <= 0.2
        assert 0.0 <= l["intensity"] <= 1.0
        assert isinstance(l["label"], str) and l["label"]
        types_seen.add(l["type"])
    # sample_dr_02 detects all three biomarkers -> expect all three types possible
    assert types_seen.issubset(VALID_TYPES)


def test_dr_02_lesions_deterministic():
    a = _predict("sample_dr_02")["lesions"]
    b = _predict("sample_dr_02")["lesions"]
    assert a == b, "Lesion positions must be deterministic for the same sample_id"


def test_normal_01_lesions_empty():
    data = _predict("sample_normal_01")
    assert data.get("lesions") == [], f"Expected empty lesions, got {data.get('lesions')}"


def test_dr_mild_03_only_microaneurysms():
    data = _predict("sample_dr_mild_03")
    lesions = data.get("lesions") or []
    assert len(lesions) > 0, "Mild NPDR should have at least one microaneurysm lesion"
    types = {l["type"] for l in lesions}
    assert types == {"microaneurysm"}, f"Expected only microaneurysms, got {types}"


def test_screenings_records_include_lesions_field():
    # Ensure at least one record exists
    _predict("sample_dr_02")
    resp = requests.get(f"{BASE_URL}/api/screenings", timeout=20)
    assert resp.status_code == 200
    screenings = resp.json()["screenings"]
    assert isinstance(screenings, list) and len(screenings) > 0
    # Every record should have the lesions key (may be empty list)
    for rec in screenings[:5]:
        assert "lesions" in rec, f"Record missing lesions field: {rec.get('scan_id')}"
        assert isinstance(rec["lesions"], list)
    # At least one dr_02 record should carry non-empty lesions
    dr02_records = [r for r in screenings if r.get("sample_id") == "sample_dr_02"]
    assert dr02_records, "No dr_02 sample found in history"
    assert any(len(r["lesions"]) > 0 for r in dr02_records)
