"""Standalone APTOS ML API.

Run after training:
  MODEL_PATH=backend/models/aptos_efficientnet_b0.pt uvicorn backend.ml_api:app --reload --port 8001
"""
from pathlib import Path
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from backend.ml.inference import predict_bytes

app = FastAPI(title="RETINA-DX APTOS ML API", version="1.0.0")
MODEL_PATH = Path(os.getenv("MODEL_PATH", "backend/models/aptos_efficientnet_b0.pt"))

@app.get("/health")
def health():
    return {"status": "ok", "model_exists": MODEL_PATH.exists(), "model_path": str(MODEL_PATH)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a retinal image file")
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="APTOS model is not trained yet")
    result = predict_bytes(await file.read(), MODEL_PATH)
    result["model_meta"] = {
        "architecture": "EfficientNet-B0",
        "dataset": "APTOS 2019 Blindness Detection",
        "mode": "APTOS_TRAINED_MODEL",
    }
    result["disclaimer"] = "Research screening prototype; not a medical diagnosis."
    return {"success": True, **result}
