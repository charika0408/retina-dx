import { ScreeningResult, SampleFundus } from "../types/screening";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_BACKEND_URL || "";

export const retinaApi = {
  async getHealth() {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  },

  async getSamples(): Promise<SampleFundus[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/samples`);
      if (!res.ok) throw new Error("Failed to load sample scans");
      const data = await res.json();
      return data.samples || [];
    } catch (err) {
      console.warn("Using fallback local samples:", err);
      return [
        {
          id: "sample_normal_01",
          title: "Normal Healthy Fundus",
          subtitle: "Grade 0 • Intact foveal reflex & clear vasculature",
          expected_risk: "low_risk",
          expected_confidence: 94.6,
          image_url: "https://images.unsplash.com/photo-1682663947127-ac9d59d7f312?q=80&w=800&auto=format&fit=crop",
          dr_grade: "Grade 0: No Apparent Diabetic Retinopathy",
          message: "Your screening did not detect significant retinal features commonly associated with diabetic retinopathy.",
          biomarkers: {
            microaneurysms: { detected: false, status: "None detected", details: "Uniform vascular integrity across macular and peripheral arcades." },
            exudates: { detected: false, status: "None observed", details: "No hard lipid deposits or cotton-wool soft spots detected." },
            hemorrhages: { detected: false, status: "None", details: "Optic nerve head and retinal parenchyma free of blot lesions." },
            macular_risk: "Low",
            vasculature_index: 96.4,
            quality_score: 98,
          },
          recommendations: [
            "Maintain routine annual comprehensive dilated eye screening.",
            "Continue standard glycemic, blood pressure, and lipid management.",
            "Schedule a clinical evaluation promptly if you notice vision changes.",
          ],
        },
        {
          id: "sample_dr_02",
          title: "Moderate NPDR Fundus",
          subtitle: "Grade 2 • Parameridian microaneurysms & exudates",
          expected_risk: "possible_signs_detected",
          expected_confidence: 88.7,
          image_url: "https://images.unsplash.com/photo-1539036776273-021ec1d78bec?q=80&w=800&auto=format&fit=crop",
          dr_grade: "Grade 2: Moderate Non-Proliferative Retinopathy",
          message: "The AI screening identified retinal features that may be associated with diabetic retinopathy.",
          biomarkers: {
            microaneurysms: { detected: true, status: "Detected", details: "Clustered microvascular outpouchings identified in temporal quadrant." },
            exudates: { detected: true, status: "Hard Exudates Present", details: "Scattered yellowish lipid deposits noted in outer foveal zone." },
            hemorrhages: { detected: true, status: "Dot Hemorrhages", details: "Minor intraretinal capillary leaks along superior vascular arcade." },
            macular_risk: "Moderate",
            vasculature_index: 71.8,
            quality_score: 92,
          },
          recommendations: [
            "Consider consulting a qualified ophthalmologist or retina specialist for professional evaluation.",
            "Review current HbA1c and metabolic targets with your primary healthcare provider.",
            "Follow-up with optical coherence tomography (OCT) if clinically advised.",
          ],
        },
        {
          id: "sample_dr_mild_03",
          title: "Early / Mild NPDR Fundus",
          subtitle: "Grade 1 • Isolated microaneurysms in parafoveal zone",
          expected_risk: "possible_signs_detected",
          expected_confidence: 82.3,
          image_url: "https://images.unsplash.com/photo-1483519173755-be893fab1f46?q=80&w=800&auto=format&fit=crop",
          dr_grade: "Grade 1: Mild Non-Proliferative Retinopathy",
          message: "The AI screening identified early microvascular markers that may be associated with diabetic retinopathy.",
          biomarkers: {
            microaneurysms: { detected: true, status: "Early Signs", details: "Sparse isolated microaneurysms observed in posterior pole." },
            exudates: { detected: false, status: "None observed", details: "Macular center clear of lipid exudation." },
            hemorrhages: { detected: false, status: "None", details: "No significant flame or blot hemorrhages detected." },
            macular_risk: "Low to Moderate",
            vasculature_index: 84.5,
            quality_score: 94,
          },
          recommendations: [
            "Consider consulting a qualified ophthalmologist for routine baseline evaluation.",
            "Emphasize tight glycemic and vascular control with your clinical team.",
            "Repeat screening within 6 to 12 months as recommended by an eye doctor.",
          ],
        },
      ];
    }
  },

  async predict(params: {
    imageBase64?: string;
    imageUrl?: string;
    sampleId?: string;
    demoMode?: boolean;
  }): Promise<ScreeningResult> {
    const payload = {
      image_base64: params.imageBase64,
      image_url: params.imageUrl,
      sample_id: params.sampleId,
      demo_mode: params.demoMode ?? false,
    };

    const res = await fetch(`${BACKEND_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = "Analysis could not be completed. Please try again.";
      try {
        const errorData = await res.json();
        if (errorData.detail) errorMsg = errorData.detail;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return res.json();
  },

  async getScreenings(): Promise<ScreeningResult[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/screenings`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.screenings || [];
    } catch {
      return [];
    }
  },
};
