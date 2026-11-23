"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateTechnicalGuide } from "@/shared/guide/guide-rules";
import type { GuideInput, GuideResult } from "@/shared/types/guide";
import type { Shade } from "@/shared/types/shade";
import type { PhotoAnalysis } from "@/web/ai/photo-analysis";

type ManualInputs = Omit<GuideInput, "selectedShade">;
interface TryOnContextValue extends GuideInput {
  shades: readonly Shade[]; targetLevel: number; liftDifference: number; guideResult: GuideResult;
  photoAnalysis: PhotoAnalysis | null; analysisPending: boolean; levelConfirmed: boolean; levelSource: "manual" | "photo";
  serverStatus: "checking" | "ready" | "offline"; dataVersion: string;
  selectShade: (id: string) => void;
  setGuideInput: <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => void;
  beginAnalysis: () => void; clearAnalysis: () => void; publishAnalysis: (analysis: PhotoAnalysis) => void;
  confirmLevel: () => void; usePhotoLevel: () => void;
}
const TryOnContext = createContext<TryOnContextValue | null>(null);

export function TryOnProvider({ shades, children }: { shades: readonly Shade[]; children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(() => shades.find((s) => s.family === "copper")?.id ?? shades[0]?.id);
  const [inputs, setInputs] = useState<ManualInputs>({ naturalLevel: 4, hairHistory: "virgin", greyPercentage: "none", hairLength: "shoulder", hairDensity: "medium" });
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null), [analysisPending, setAnalysisPending] = useState(false);
  const [levelConfirmed, setConfirmed] = useState(false), [levelSource, setLevelSource] = useState<"manual" | "photo">("manual");
  const [server, setServer] = useState<{ key: string; result: GuideResult | null; failed: boolean; version: string }>({ key: "", result: null, failed: false, version: "" });
  const selectedShade = useMemo(() => shades.find((s) => s.id === selectedId) ?? shades[0], [shades, selectedId]);
  if (!selectedShade) throw new Error("The studio needs at least one demo shade.");
  const selectShade = useCallback((id: string) => { if (shades.some((s) => s.id === id)) setSelectedId(id); }, [shades]);
  const setGuideInput = useCallback(<K extends keyof ManualInputs,>(key: K, value: ManualInputs[K]) => {
    setInputs((current) => current[key] === value ? current : { ...current, [key]: value });
    if (key === "naturalLevel") { setLevelSource("manual"); setConfirmed(true); }
  }, []);
  const clearAnalysis = useCallback(() => { setPhotoAnalysis(null); setAnalysisPending(false); setLevelSource("manual"); setConfirmed(false); }, []);
  const beginAnalysis = useCallback(() => { setPhotoAnalysis(null); setAnalysisPending(true); setConfirmed(false); }, []);
  const publishAnalysis = useCallback((analysis: PhotoAnalysis) => {
    setPhotoAnalysis(analysis); setAnalysisPending(false); setLevelSource("photo"); setConfirmed(false);
    setInputs((current) => ({ ...current, naturalLevel: analysis.estimatedLevel }));
  }, []);
  const usePhotoLevel = useCallback(() => {
    if (photoAnalysis) { setInputs((current) => ({ ...current, naturalLevel: photoAnalysis.estimatedLevel })); setLevelSource("photo"); setConfirmed(false); }
  }, [photoAnalysis]);
  const confirmLevel = useCallback(() => setConfirmed(true), []);
  const localGuide = useMemo(() => generateTechnicalGuide({ ...inputs, selectedShade }), [inputs, selectedShade]);
  const requestKey = JSON.stringify({ ...inputs, shadeId: selectedShade.id });
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/guide/calc/", { method: "POST", headers: { "Content-Type": "application/json" }, body: requestKey, signal: abort.signal });
          if (!response.ok) throw new Error("Guide service unavailable");
          const data = await response.json();
          if (!data.assessment || data.assessment.selectedShade?.id !== JSON.parse(requestKey).shadeId) throw new Error("Invalid assessment");
          if (!abort.signal.aborted) setServer({ key: requestKey, result: data.assessment, failed: false, version: data.dataVersion });
        } catch { if (!abort.signal.aborted) setServer({ key: requestKey, result: null, failed: true, version: "" }); }
      })();
    }, 120);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [requestKey]);
  const guideResult = server.key === requestKey && server.result ? server.result : localGuide;
  const value: TryOnContextValue = { ...inputs, selectedShade, shades, targetLevel: selectedShade.level,
    liftDifference: guideResult.liftDifference, guideResult, selectShade, setGuideInput,
    photoAnalysis, analysisPending, levelConfirmed, levelSource, beginAnalysis, clearAnalysis, publishAnalysis, confirmLevel, usePhotoLevel,
    serverStatus: server.key !== requestKey ? "checking" : server.failed ? "offline" : "ready", dataVersion: server.version };
  return <TryOnContext.Provider value={value}>{children}</TryOnContext.Provider>;
}
export function useTryOn() { const context = useContext(TryOnContext); if (!context) throw new Error("useTryOn must be used inside TryOnProvider."); return context; }
