import React, { createContext, useContext, useState, useEffect } from "react";
import { ScreeningResult, SampleFundus } from "../types/screening";
import { retinaApi } from "../api/retinaApi";

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
  const [samples, setSamples] = useState<SampleFundus[]>([]);

  useEffect(() => {
    retinaApi.getSamples().then(setSamples).catch(console.error);
  }, []);

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
    if (!selectedImageUri && !selectedSample) {
      throw new Error("Please select a retinal image first.");
    }

    setIsAnalyzing(true);
    try {
      const res = await retinaApi.predict({
        imageBase64: selectedImageBase64 || undefined,
        imageUrl: selectedImageUri || undefined,
        sampleId: selectedSample ? selectedSample.id : undefined,
        demoMode: demoMode,
      });

      const fullResult: ScreeningResult = {
        ...res,
        image_uri: selectedImageUri || selectedSample?.image_url,
      };

      setCurrentResult(fullResult);
      return fullResult;
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
  if (!context) {
    throw new Error("useScreening must be used within a ScreeningProvider");
  }
  return context;
}
