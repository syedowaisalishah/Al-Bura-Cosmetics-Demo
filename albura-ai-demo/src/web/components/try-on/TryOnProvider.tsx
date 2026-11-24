"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GuideInput, GuideResult, HairProfile } from "@/shared/types/guide";
import type { Shade } from "@/shared/types/shade";
import type { PhotoAnalysis } from "@/web/ai/photo-analysis";
import { useGuideAssessment } from "@/web/hooks/useGuideAssessment";

interface TryOnContextValue extends GuideInput {
  shades: readonly Shade[];
  targetLevel: number;
  liftDifference: number;
  guideResult: GuideResult;
  photoAnalysis: PhotoAnalysis | null;
  analysisPending: boolean;
  levelConfirmed: boolean;
  levelSource: "manual" | "photo";
  serverStatus: "checking" | "ready" | "offline";
  dataVersion: string;
  selectShade: (id: string) => void;
  setGuideInput: <K extends keyof HairProfile>(key: K, value: HairProfile[K]) => void;
  beginAnalysis: () => void;
  clearAnalysis: () => void;
  publishAnalysis: (analysis: PhotoAnalysis) => void;
  confirmLevel: () => void;
  usePhotoLevel: () => void;
}

const TryOnContext = createContext<TryOnContextValue | null>(null);

/** One source of selection/profile state keeps the try-on and consultation panels in sync. */
export function TryOnProvider({ shades, children }: { shades: readonly Shade[]; children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(
    () => shades.find((shade) => shade.family === "copper")?.id ?? shades[0]?.id,
  );
  const [inputs, setInputs] = useState<HairProfile>({
    naturalLevel: 4,
    hairHistory: "virgin",
    greyPercentage: "none",
    hairLength: "shoulder",
    hairDensity: "medium",
  });
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [levelConfirmed, setConfirmed] = useState(false);
  const [levelSource, setLevelSource] = useState<"manual" | "photo">("manual");

  const selectedShade = useMemo(
    () => shades.find((shade) => shade.id === selectedId) ?? shades[0],
    [shades, selectedId],
  );
  if (!selectedShade) throw new Error("The studio needs at least one demo shade.");

  const { guideResult, serverStatus, dataVersion } = useGuideAssessment(inputs, selectedShade);

  const selectShade = useCallback((id: string) => {
    if (shades.some((shade) => shade.id === id)) setSelectedId(id);
  }, [shades]);

  const setGuideInput = useCallback(<K extends keyof HairProfile,>(key: K, value: HairProfile[K]) => {
    setInputs((current) => current[key] === value ? current : { ...current, [key]: value });
    if (key === "naturalLevel") {
      setLevelSource("manual");
      setConfirmed(true);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setPhotoAnalysis(null);
    setAnalysisPending(false);
    setLevelSource("manual");
    setConfirmed(false);
  }, []);

  const beginAnalysis = useCallback(() => {
    setPhotoAnalysis(null);
    setAnalysisPending(true);
    setConfirmed(false);
  }, []);

  // The estimate comes from original photo pixels and always needs confirmation.
  const publishAnalysis = useCallback((analysis: PhotoAnalysis) => {
    setPhotoAnalysis(analysis);
    setAnalysisPending(false);
    setLevelSource("photo");
    setConfirmed(false);
    setInputs((current) => ({ ...current, naturalLevel: analysis.estimatedLevel }));
  }, []);

  const usePhotoLevel = useCallback(() => {
    if (!photoAnalysis) return;
    setInputs((current) => ({ ...current, naturalLevel: photoAnalysis.estimatedLevel }));
    setLevelSource("photo");
    setConfirmed(false);
  }, [photoAnalysis]);

  const confirmLevel = useCallback(() => setConfirmed(true), []);

  const value: TryOnContextValue = {
    ...inputs,
    selectedShade,
    shades,
    targetLevel: selectedShade.level,
    liftDifference: guideResult.liftDifference,
    guideResult,
    selectShade,
    setGuideInput,
    photoAnalysis,
    analysisPending,
    levelConfirmed,
    levelSource,
    beginAnalysis,
    clearAnalysis,
    publishAnalysis,
    confirmLevel,
    usePhotoLevel,
    serverStatus,
    dataVersion,
  };

  return <TryOnContext.Provider value={value}>{children}</TryOnContext.Provider>;
}

export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) throw new Error("useTryOn must be used inside TryOnProvider.");
  return context;
}
