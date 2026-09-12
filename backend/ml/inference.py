"""APTOS EfficientNet inference used by the FastAPI API."""
from __future__ import annotations

import io
from pathlib import Path
from typing import Dict, Any

import torch
from PIL import Image
from torchvision import models, transforms

CLASS_NAMES = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"]
GRADE_DETAILS = [
    "Grade 0: No Apparent Diabetic Retinopathy",
    "Grade 1: Mild Non-Proliferative Retinopathy",
    "Grade 2: Moderate Non-Proliferative Retinopathy",
    "Grade 3: Severe Non-Proliferative Retinopathy",
    "Grade 4: Proliferative Diabetic Retinopathy",
]

_model = None
_model_path = None
_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def load_model(model_path: str | Path):
    global _model, _model_path
    model_path = str(model_path)
    if _model is not None and _model_path == model_path:
        return _model
    checkpoint = torch.load(model_path, map_location="cpu")
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 5)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    _model, _model_path = model, model_path
    return model


def predict_bytes(image_bytes: bytes, model_path: str | Path) -> Dict[str, Any]:
    model = load_model(model_path)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _transform(image).unsqueeze(0)
    with torch.inference_mode():
        probs = torch.softmax(model(tensor), dim=1)[0]
    grade = int(torch.argmax(probs).item())
    confidence = float(probs[grade].item() * 100.0)
    return {
        "grade": grade,
        "class_name": CLASS_NAMES[grade],
        "dr_grade": GRADE_DETAILS[grade],
        "confidence": round(confidence, 2),
        "probabilities": {CLASS_NAMES[i]: round(float(probs[i].item() * 100.0), 2) for i in range(5)},
        "risk_level": "low_risk" if grade == 0 else "possible_signs_detected",
        "risk_label": "LOW RISK" if grade == 0 else "POSSIBLE SIGNS DETECTED",
    }
