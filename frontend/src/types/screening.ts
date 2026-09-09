export interface BiomarkerDetail {
  detected: boolean;
  status: string;
  details: string;
}

export interface Biomarkers {
  microaneurysms: BiomarkerDetail;
  exudates: BiomarkerDetail;
  hemorrhages: BiomarkerDetail;
  macular_risk: string;
  vasculature_index: number;
  quality_score: number;
}

export interface ModelMeta {
  architecture: string;
  dataset: string;
  mode: string;
  execution_time_ms: number;
  version: string;
}

export interface ScreeningResult {
  success: boolean;
  scan_id: string;
  id?: string;
  risk_level: "low_risk" | "possible_signs_detected";
  risk_label: "LOW RISK" | "POSSIBLE SIGNS DETECTED";
  confidence: number;
  dr_grade: string;
  message: string;
  biomarkers: Biomarkers;
  recommendations: string[];
  disclaimer: string;
  model_meta: ModelMeta;
  created_at: string;
  sample_id?: string;
  image_uri?: string;
}

export interface SampleFundus {
  id: string;
  title: string;
  subtitle: string;
  expected_risk: "low_risk" | "possible_signs_detected";
  expected_confidence: number;
  image_url: string;
  dr_grade: string;
  message: string;
  biomarkers: Biomarkers;
  recommendations: string[];
}
