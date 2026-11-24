"use client";

import { useEffect, useMemo, useState } from "react";
import { generateTechnicalGuide } from "@/shared/guide/guide-rules";
import type { GuideRequest, GuideResult, HairProfile } from "@/shared/types/guide";
import type { Shade } from "@/shared/types/shade";

interface ServerAssessment {
  requestKey: string;
  result: GuideResult | null;
  failed: boolean;
  dataVersion: string;
}

interface GuideAssessment {
  guideResult: GuideResult;
  serverStatus: "checking" | "ready" | "offline";
  dataVersion: string;
}

const REQUEST_DELAY_MS = 120;

/** Keep the guide responsive locally, then replace it with the current server assessment. */
export function useGuideAssessment(profile: HairProfile, selectedShade: Shade): GuideAssessment {
  const [server, setServer] = useState<ServerAssessment>({
    requestKey: "",
    result: null,
    failed: false,
    dataVersion: "",
  });

  const localGuide = useMemo(
    () => generateTechnicalGuide({ ...profile, selectedShade }),
    [profile, selectedShade],
  );

  // Images, masks and full client-supplied shade records are excluded from this contract.
  const request: GuideRequest = { ...profile, shadeId: selectedShade.id };
  const requestKey = JSON.stringify(request);

  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/guide/calc/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestKey,
            signal: abort.signal,
          });
          if (!response.ok) throw new Error("Guide service unavailable");

          const data = await response.json();
          const requestedProfile: GuideRequest = JSON.parse(requestKey);
          if (!data.assessment || data.assessment.selectedShade?.id !== requestedProfile.shadeId) {
            throw new Error("Invalid assessment");
          }

          if (!abort.signal.aborted) {
            setServer({ requestKey, result: data.assessment, failed: false, dataVersion: data.dataVersion });
          }
        } catch {
          if (!abort.signal.aborted) {
            setServer({ requestKey, result: null, failed: true, dataVersion: "" });
          }
        }
      })();
    }, REQUEST_DELAY_MS);

    // A replaced profile or unmounted page must not receive a stale response.
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [requestKey]);

  const isCurrent = server.requestKey === requestKey;
  const serverStatus = !isCurrent ? "checking" : server.failed ? "offline" : "ready";

  return {
    guideResult: isCurrent && server.result ? server.result : localGuide,
    serverStatus,
    dataVersion: server.dataVersion,
  };
}
