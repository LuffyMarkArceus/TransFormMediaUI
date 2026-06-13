"use client";

import { use, useCallback, useMemo, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams  } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import {ImagePreview} from "./_components/ImagePreview";
import {TransformPanel} from "./_components/TransformPanel";
import {areParamsEqual, type ProcessParams} from "@/lib/image-process-params";


interface ImagePageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_PARAMS: ProcessParams = {
  w: 1920,
  h: 1080,
  q: 85,
  format: "jpeg",
  blur: undefined,
  grayscale: undefined,
  cw: undefined,
  ch: undefined,
  gravity: undefined,
};

export default function ImagePage({ params, }: ImagePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const unwrappedParams = use(params)
  const imageId = unwrappedParams.id;

  const [isProcessing, setIsProcessing] = useState(false);
  

  // Parse URL -> strongly types params
  const processParams : ProcessParams = useMemo(() => ({
    w: Number(searchParams.get("w")) || 1920,
    h: Number(searchParams.get("h")) || 1080,
    q: Number(searchParams.get("q")) || 85,
    format: searchParams.get("format") || "jpeg",
    blur: searchParams.get("blur") ? Number(searchParams.get("blur")) : undefined,
    grayscale: searchParams.get("grayscale") === "true" ? true : undefined,
    cw: searchParams.get("cw") ? Number(searchParams.get("cw")) : undefined,
    ch: searchParams.get("ch") ? Number(searchParams.get("ch")) : undefined,
    gravity: searchParams.get("gravity") || undefined,
  }), [searchParams])

  const [uiParams, setUiParams] = useState<ProcessParams>(processParams);
  const uiParamsRef = useRef(uiParams);
  const undoStackRef = useRef<ProcessParams[]>([]);

  useEffect(() => {
    uiParamsRef.current = uiParams;
  }, [uiParams]);

  useEffect(() => {
    if (!areParamsEqual(processParams, uiParams)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUiParams(processParams);
    }
  }, [processParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedUiParams = useDebouncedValue(uiParams, 400);

  useEffect(() => {
    if (areParamsEqual(debouncedUiParams, processParams)) return;
    
    const sp = new URLSearchParams();
    if (debouncedUiParams.w) sp.set("w", String(debouncedUiParams.w));
    if (debouncedUiParams.h) sp.set("h", String(debouncedUiParams.h));
    if (debouncedUiParams.q) sp.set("q", String(debouncedUiParams.q));
    if (debouncedUiParams.format) sp.set("format", debouncedUiParams.format);
    if (debouncedUiParams.blur) sp.set("blur", String(debouncedUiParams.blur));
    if (debouncedUiParams.grayscale) sp.set("grayscale", "true");
    if (debouncedUiParams.cw) sp.set("cw", String(debouncedUiParams.cw));
    if (debouncedUiParams.ch) sp.set("ch", String(debouncedUiParams.ch));
    if (debouncedUiParams.gravity) sp.set("gravity", debouncedUiParams.gravity);

    router.replace(`?${sp.toString()}`, {scroll: false});
  }, [debouncedUiParams, router, processParams]);

  const handleUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (prev) {
      setIsProcessing(true);
      setUiParams(prev);
    }
  }, []);

  const onTransformChange = useCallback((next: ProcessParams) => {
    undoStackRef.current.push(uiParamsRef.current);
    setUiParams(next);
  }, []);

  const handleReset = useCallback(() => {
    undoStackRef.current.push(uiParamsRef.current);
    setIsProcessing(true);
    setUiParams(DEFAULT_PARAMS);
  }, []);

  const handleGrayscaleToggle = useCallback(() => {
    undoStackRef.current.push(uiParamsRef.current);
    setIsProcessing(true);
    setUiParams(prev => ({ ...prev, grayscale: prev.grayscale ? undefined : true }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleReset();
      } else if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleGrayscaleToggle();
      } else if (e.key === "Escape") {
        e.preventDefault();
        router.push("/dashboard");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleReset, handleGrayscaleToggle, handleUndo, router]);

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_320px] gap-6">
      <ImagePreview
        imageId={imageId}
        params={processParams}
        previewParams={uiParams}
        isProcessing={isProcessing}
        onLoadComplete={() => setIsProcessing(false)}
        onLoadError={() => setIsProcessing(false)}
      />

      <TransformPanel
        params={processParams}
        onProcessingStart={() => setIsProcessing(true)}
        onChange={(next) => {
          setIsProcessing(true);
          onTransformChange(next);
        }}
      />
    </div>
  )
}
