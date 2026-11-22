"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { generateTechnicalGuide } from "@/lib/guide/guide-rules";
import type { GuideInput, GuideResult } from "@/types/guide";
import type { Shade } from "@/types/shade";

type ManualInputs = Omit<GuideInput, "selectedShade">;
interface TryOnContextValue extends GuideInput {
  shades: readonly Shade[];
  targetLevel: number;
  liftDifference: number;
  guideResult: GuideResult;
  selectShade: (id: string) => void;
  setGuideInput: <K extends keyof ManualInputs>(key: K, value: ManualInputs[K]) => void;
}
const TryOnContext = createContext<TryOnContextValue | null>(null);

/** Only manual inputs are stored. The selected JSON shade derives target and result. */
export function TryOnProvider({ shades, children }: { shades: readonly Shade[]; children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(() => shades.find((shade) => shade.family === "copper")?.id ?? shades[0]?.id);
  const [inputs, setInputs] = useState<ManualInputs>({ naturalLevel: 4, hairHistory: "virgin", greyPercentage: "none", hairLength: "shoulder", hairDensity: "medium" });
  const selectedShade = useMemo(() => shades.find((shade) => shade.id === selectedId) ?? shades[0], [shades, selectedId]);
  if (!selectedShade) throw new Error("The studio needs at least one demo shade.");
  const selectShade = useCallback((id: string) => {
    if (shades.some((shade) => shade.id === id)) setSelectedId(id);
  }, [shades]);
  const setGuideInput = useCallback(<K extends keyof ManualInputs,>(key: K, value: ManualInputs[K]) => {
    setInputs((current) => current[key] === value ? current : { ...current, [key]: value });
  }, []);
  const guideResult = useMemo(() => generateTechnicalGuide({ ...inputs, selectedShade }), [inputs, selectedShade]);
  const value = useMemo<TryOnContextValue>(() => ({
    ...inputs, selectedShade, shades, targetLevel: selectedShade.level,
    liftDifference: guideResult.liftDifference, guideResult, selectShade, setGuideInput,
  }), [inputs, selectedShade, shades, guideResult, selectShade, setGuideInput]);
  return <TryOnContext.Provider value={value}>{children}</TryOnContext.Provider>;
}
export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) throw new Error("useTryOn must be used inside TryOnProvider.");
  return context;
}
