import React, { createContext, useContext, useState } from "react";
import { ScreeningResult, SampleFundus } from "../types/screening";
import { runOfflineAptosScreening } from "../ml/localInference";

interface ScreeningContextType {
  selectedImageUri: string | null;
  selectedImageBase64: string | null;
  selectedSample: SampleFundus | null;
  demoMode: boolean;
  currentResult: ScreeningResult | null;
  isAnalyzing: boolean;
  samples: SampleFundus[];
  setSelectedImage: (uri: string | null, base64?: string | null) => void;
  selectSample: (sample: SampleFundus) => void;
  clearSelection: () => void;
  setDemoMode: (enabled: boolean) => void;
  setCurrentResult: (result: ScreeningResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  runScreening: () => Promise<ScreeningResult>;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export function ScreeningProvider({ children }: { children: React.ReactNode }) {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleFundus | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ScreeningResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Samples are intentionally not fetched from the backend. The app is offline-first.
  // Real local sample assets can be added later without changing the inference path.
  const samples: SampleFundus[] = [];

  const setSelectedImage = (uri: string | null, base64: string | null = null) => {
    setSelectedImageUri(uri);
    setSelectedImageBase64(base64);
    setSelectedSample(null);
  };

  const selectSample = (sample: SampleFundus) => {
    setSelectedSample(sample);
    setSelectedImageUri(sample.image_url);
    setSelectedImageBase64(null);
  };

  const clearSelection = () => {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setSelectedSample(null);
  };

  const runScreening = async (): Promise<ScreeningResult> => {
    if (!selectedImageUri) {
      throw new Error("Please select a retinal image first.");
    }
    if (selectedSample) {
      throw new Error("Sample images are not available in offline mode. Select a photo from your device.");
    }

    setIsAnalyzing(true);
    const started = Date.now();
    try {
      if (demoMode) {
        const result: ScreeningResult = {
          success: true,
          scan_id: `RDX-DEMO-${Date.now().toString(36).toUpperCase()}`,
          risk_level: "low_risk",
          risk_label: "LOW RISK",
          confidence: 94.6,
          dr_grade: "Grade 0: No Apparent Diabetic Retinopathy",
          message: "Offline demo result. Turn DEMO off to run the bundled APTOS model.",
          biomarkers: {
            microaneurysms: { detected: false, status: "Demo only", details: "Not separately modeled." },
            exudates: { detected: false, status: "Demo only", details: "Not separately modeled." },
            hemorrhages: { detected: false, status: "Demo only", details: "Not separately modeled." },
            macular_risk: "Not separately modeled",
            vasculature_index: 0,
            quality_score: 0,
          },
          recommendations: ["Demo mode is not an AI prediction.", "Turn DEMO off for the bundled APTOS model."],
          lesions: [],
          disclaimer: "RETINA-DX is an AI-powered research prototype and does not provide a medical diagnosis.",
          model_meta: {
            architecture: "Offline demo",
            dataset: "None",
            mode: "DEMO_MODE",
            execution_time_ms: Date.now() - started,
            version: "offline-demo",
          },
          created_at: new Date().toISOString(),
          image_uri: selectedImageUri,
        };
        setCurrentResult(result);
        return result;
      }

      const ml = await runOfflineAptosScreening(selectedImageUri);
      const positive = ml.grade > 0;
      const result: ScreeningResult = {
        success: true,
        scan_id: `RDX-${Date.now().toString(36).toUpperCase()}`,
        risk_level: positive ? "possible_signs_detected" : "low_risk",
        risk_label: positive ? "POSSIBLE SIGNS DETECTED" : "LOW RISK",
        confidence: Number((ml.confidence * 100).toFixed(2)),
        dr_grade: `Grade ${ml.grade}: ${ml.class_name}`,
        message: positive
          ? "The offline APTOS-trained EfficientNet-B0 screening model identified changes that may be associated with diabetic retinopathy."
          : "The offline APTOS-trained EfficientNet-B0 screening model did not identify significant changes associated with diabetic retinopathy.",
        biomarkers: {
          microaneurysms: { detected: false, status: "Not separately modeled", details: "This classifier predicts disease severity and does not localize individual lesions." },
          exudates: { detected: false, status: "Not separately modeled", details: "This classifier predicts disease severity and does not localize individual lesions." },
          hemorrhages: { detected: false, status: "Not separately modeled", details: "This classifier predicts disease severity and does not localize individual lesions." },
          macular_risk: "Not separately modeled",
          vasculature_index: 0,
          quality_score: 0,
        },
        recommendations: [
          "Use this result only as an AI screening aid, not a diagnosis.",
          "Consider professional ophthalmic evaluation, especially for grades 1–4 or visual symptoms.",
          "Validate the model on an independent clinical dataset before any clinical use.",
        ],
        lesions: [],
        disclaimer: "RETINA-DX is an AI-powered research prototype and does not provide a medical diagnosis.",
        model_meta: {
          architecture: "EfficientNet-B0 (APTOS 2019) — ONNX Runtime on device",
          dataset: "APTOS 2019 Blindness Detection",
          mode: "OFFLINE_APTOS_MODEL",
          execution_time_ms: Date.now() - started,
          version: "v5.0-offline-aptos",
        },
        created_at: new Date().toISOString(),
        image_uri: selectedImageUri,
      };

      setCurrentResult(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScreeningContext.Provider
      value={{
        selectedImageUri,
        selectedImageBase64,
        selectedSample,
        demoMode,
        currentResult,
        isAnalyzing,
        samples,
        setSelectedImage,
        selectSample,
        clearSelection,
        setDemoMode,
        setCurrentResult,
        setIsAnalyzing,
        runScreening,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  const context = useContext(ScreeningContext);
  if (!context) throw new Error("useScreening must be used within a ScreeningProvider");
  return context;
}
