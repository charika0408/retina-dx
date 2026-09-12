import os
import uuid
import time
import base64
import logging
from pathlib import Path
from typing import Annotated, Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("retina-dx")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
APTOS_MODEL_PATH = Path(os.environ.get("APTOS_MODEL_PATH", str(ROOT_DIR / "models" / "aptos_efficientnet_b0.pt")))

try:
    from backend.ml.inference import predict_bytes as predict_aptos_bytes
except Exception:
    predict_aptos_bytes = None

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else str(v) if v is not None else "")]

class BaseDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"] is None:
            del data["_id"]
        return data
    @classmethod
    def from_mongo(cls, data: dict):
        return cls(**data) if data else None

class BiomarkerDetail(BaseModel):
    detected: bool
    status: str
    details: str
class Biomarkers(BaseModel):
    microaneurysms: BiomarkerDetail
    exudates: BiomarkerDetail
    hemorrhages: BiomarkerDetail
    macular_risk: str
    vasculature_index: float
    quality_score: int
class Lesion(BaseModel):
    type: str
    x: float
    y: float
    radius: float
    intensity: float
    label: str
class ModelMeta(BaseModel):
    architecture: str = "EfficientNet-B0 (APTOS 2019)"
    dataset: str = "APTOS 2019 Blindness Detection"
    mode: str
    execution_time_ms: int
    version: str = "v4.0-aptos-only"
class ScreeningRecord(BaseDocument):
    scan_id: str = Field(default_factory=lambda: f"RDX-{uuid.uuid4().hex[:8].upper()}")
    risk_level: str
    risk_label: str
    confidence: float
    dr_grade: str
    message: str
    biomarkers: Biomarkers
    recommendations: List[str]
    lesions: List[Lesion] = []
    disclaimer: str = "RETINA-DX is an AI-powered research prototype and does not provide a medical diagnosis."
    model_meta: ModelMeta
    image_preview: Optional[str] = None
    sample_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
class PredictRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    sample_id: Optional[str] = None
    demo_mode: bool = False
    patient_note: Optional[str] = None

SAMPLE_FUNDUS_DATA = [
    {"id":"sample_normal_01","title":"Normal Healthy Fundus","subtitle":"Grade 0 • Reference image","expected_risk":"low_risk","expected_confidence":94.6,"image_url":"https://commons.wikimedia.org/wiki/Special:FilePath/Fundus_photograph_of_normal_right_eye.jpg?width=800","lesions":[],"dr_grade":"Grade 0: No Apparent Diabetic Retinopathy","message":"Reference sample for Grade 0 screening.","biomarkers":{"microaneurysms":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"exudates":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"hemorrhages":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"macular_risk":"Not separately modeled","vasculature_index":0,"quality_score":0},"recommendations":["Use sample scans only to understand the interface."]},
    {"id":"sample_dr_02","title":"Moderate NPDR Fundus","subtitle":"Grade 2 • Reference image","expected_risk":"possible_signs_detected","expected_confidence":88.7,"image_url":"https://commons.wikimedia.org/wiki/Special:FilePath/Fundus_-_diabetic_retinopathy.png?width=800","lesions":[],"dr_grade":"Grade 2: Moderate Non-Proliferative Retinopathy","message":"Reference sample for Grade 2 screening.","biomarkers":{"microaneurysms":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"exudates":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"hemorrhages":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"macular_risk":"Not separately modeled","vasculature_index":0,"quality_score":0},"recommendations":["Use sample scans only to understand the interface."]},
    {"id":"sample_dr_mild_03","title":"Early / Mild NPDR Fundus","subtitle":"Grade 1 • Reference image","expected_risk":"possible_signs_detected","expected_confidence":82.3,"image_url":"https://commons.wikimedia.org/wiki/Special:FilePath/Fundus_retinopathy_EDA03.JPG?width=800","lesions":[],"dr_grade":"Grade 1: Mild Non-Proliferative Retinopathy","message":"Reference sample for Grade 1 screening.","biomarkers":{"microaneurysms":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"exudates":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"hemorrhages":{"detected":False,"status":"Not separately modeled","details":"Reference sample only."},"macular_risk":"Not separately modeled","vasculature_index":0,"quality_score":0},"recommendations":["Use sample scans only to understand the interface."]}
]

app = FastAPI(title="RETINA-DX AI Screening API", description="APTOS 2019 EfficientNet-B0 retinal screening API", version="4.0.0")
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"platform":"RETINA-DX","tagline":"AI-powered retinal screening","status":"operational","version":"v4.0","ai_engine":"APTOS-2019 EfficientNet-B0","aptos_model_available":APTOS_MODEL_PATH.exists(),"external_llm_used":False,"disclaimer":"RETINA-DX is an AI-powered research prototype and does not provide a medical diagnosis."}

@api_router.get("/health")
async def health_check():
    db_ok=True
    try:
        await db.command("ping")
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        db_ok=False
    return {"status":"healthy" if db_ok else "degraded","database":"connected" if db_ok else "disconnected","aptos_model_available":APTOS_MODEL_PATH.exists(),"aptos_model_path":str(APTOS_MODEL_PATH),"external_llm_used":False,"timestamp":datetime.now(timezone.utc).isoformat()}

@api_router.get("/samples")
async def get_samples():
    return {"samples":SAMPLE_FUNDUS_DATA}

def aptos_to_api_result(ml: Dict[str,Any]) -> Dict[str,Any]:
    grade=int(ml["grade"])
    name=ml["class_name"]
    confidence=float(ml["confidence"])
    positive=grade > 0
    return {"risk_level":"possible_signs_detected" if positive else "low_risk","risk_label":"POSSIBLE SIGNS DETECTED" if positive else "LOW RISK","confidence":round(confidence*100,2),"dr_grade":f"Grade {grade}: {name}","message":"The APTOS-trained EfficientNet-B0 screening model identified retinal changes that may be associated with diabetic retinopathy." if positive else "The APTOS-trained EfficientNet-B0 screening model did not identify significant retinal changes associated with diabetic retinopathy.","biomarkers":{"microaneurysms":{"detected":False,"status":"Not separately modeled","details":"The APTOS classifier predicts disease severity; it does not localize individual lesions."},"exudates":{"detected":False,"status":"Not separately modeled","details":"The APTOS classifier predicts disease severity; it does not localize individual lesions."},"hemorrhages":{"detected":False,"status":"Not separately modeled","details":"The APTOS classifier predicts disease severity; it does not localize individual lesions."},"macular_risk":"Not separately modeled","vasculature_index":0.0,"quality_score":0},"recommendations":["Use this result only as an AI screening aid, not a diagnosis.","Consider professional ophthalmic evaluation, especially for grades 1–4 or visual symptoms.","For clinical use, validate the trained model on an independent clinical dataset."],"lesions":[],"ml_result":{"grade":grade,"class_name":name,"confidence":confidence,"probabilities":ml.get("probabilities",{}),"risk_level":ml.get("risk_level")}}

@api_router.post("/predict")
async def predict_retinal_image(request: PredictRequest):
    start_time=time.time()
    if not request.image_base64 and not request.image_url and not request.sample_id:
        raise HTTPException(status_code=400,detail="Please select a retinal image first.")
    if request.demo_mode or (request.sample_id and not request.image_base64):
        sample=next((s for s in SAMPLE_FUNDUS_DATA if s["id"]==request.sample_id),SAMPLE_FUNDUS_DATA[0])
        analysis_data=sample
        mode_used="DEMO_MODE"
    elif request.image_base64:
        if not APTOS_MODEL_PATH.exists() or predict_aptos_bytes is None:
            raise HTTPException(status_code=503,detail="APTOS model is not installed on this server. Train the model and place aptos_efficientnet_b0.pt in backend/models/.")
        try:
            clean=request.image_base64.split(",",1)[-1]
            raw=base64.b64decode(clean,validate=True)
            analysis_data=aptos_to_api_result(predict_aptos_bytes(raw,str(APTOS_MODEL_PATH)))
            mode_used="APTOS_TRAINED_MODEL"
        except Exception as e:
            logger.exception("APTOS model inference failed")
            raise HTTPException(status_code=500,detail=f"APTOS model inference failed: {e}")
    else:
        raise HTTPException(status_code=400,detail="A real retinal image is required for APTOS inference.")
    elapsed_ms=int((time.time()-start_time)*1000)
    raw_bm=analysis_data.get("biomarkers",{})
    biomarkers=Biomarkers(microaneurysms=BiomarkerDetail(**raw_bm.get("microaneurysms",{"detected":False,"status":"Not separately modeled","details":"Not available"})),exudates=BiomarkerDetail(**raw_bm.get("exudates",{"detected":False,"status":"Not separately modeled","details":"Not available"})),hemorrhages=BiomarkerDetail(**raw_bm.get("hemorrhages",{"detected":False,"status":"Not separately modeled","details":"Not available"})),macular_risk=raw_bm.get("macular_risk","Not separately modeled"),vasculature_index=float(raw_bm.get("vasculature_index",0)),quality_score=int(raw_bm.get("quality_score",0)))
    record=ScreeningRecord(risk_level=analysis_data["risk_level"],risk_label=analysis_data["risk_label"],confidence=float(analysis_data["confidence"]),dr_grade=analysis_data["dr_grade"],message=analysis_data["message"],biomarkers=biomarkers,recommendations=analysis_data.get("recommendations",[]),lesions=[],model_meta=ModelMeta(mode=mode_used,execution_time_ms=elapsed_ms),sample_id=request.sample_id)
    try:
        res=await db.screenings.insert_one(record.to_mongo())
        record.id=str(res.inserted_id)
    except Exception as e:
        logger.error(f"Failed to persist screening to MongoDB: {e}")
    result={"success":True,"scan_id":record.scan_id,"id":record.id,"risk_level":record.risk_level,"risk_label":record.risk_label,"confidence":record.confidence,"dr_grade":record.dr_grade,"message":record.message,"biomarkers":record.biomarkers.model_dump(),"recommendations":record.recommendations,"lesions":[],"disclaimer":record.disclaimer,"model_meta":record.model_meta.model_dump(),"created_at":record.created_at.isoformat()}
    result["ml_result"]=analysis_data.get("ml_result")
    return result

@api_router.get("/screenings")
async def get_screenings(limit:int=20):
    try:
        docs=await db.screenings.find({"deleted_at":None}).sort("created_at",-1).limit(limit).to_list(length=limit)
        return {"screenings":[ScreeningRecord.from_mongo(d).model_dump(by_alias=False) for d in docs]}
    except Exception as e:
        logger.error(f"Failed to fetch screenings: {e}")
        return {"screenings":[]}

@api_router.get("/screenings/{scan_id}")
async def get_screening_detail(scan_id:str):
    doc=await db.screenings.find_one({"$or":[{"scan_id":scan_id},{"_id":scan_id}],"deleted_at":None})
    if not doc and ObjectId.is_valid(scan_id):
        doc=await db.screenings.find_one({"_id":ObjectId(scan_id),"deleted_at":None})
    if not doc:
        raise HTTPException(status_code=404,detail="Screening record not found")
    return ScreeningRecord.from_mongo(doc).model_dump(by_alias=False)

@api_router.delete("/screenings/{scan_id}")
async def delete_screening(scan_id:str):
    query={"$or":[{"scan_id":scan_id},{"_id":scan_id}]}
    if ObjectId.is_valid(scan_id):
        query["$or"].append({"_id":ObjectId(scan_id)})
    res=await db.screenings.update_one(query,{"$set":{"deleted_at":datetime.now(timezone.utc)}})
    if res.matched_count==0:
        raise HTTPException(status_code=404,detail="Record not found")
    return {"success":True,"message":"Screening soft-deleted successfully"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware,allow_credentials=True,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
