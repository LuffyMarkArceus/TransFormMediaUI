"use client";

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { ProcessParams } from "@/lib/image-process-params";

const GRAVITY_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "topleft", label: "Top Left" },
  { value: "topright", label: "Top Right" },
  { value: "bottomleft", label: "Bottom Left" },
  { value: "bottomright", label: "Bottom Right" },
]

export interface TransformPanelProps {
  params: ProcessParams;
  onChange: (next: Partial<ProcessParams>) => void;
  onProcessingStart: () => void;
}

export function TransformPanel({ params, onChange, onProcessingStart }: TransformPanelProps) {

    return (
    <Card className="space-y-4 p-4">
      <Label className="text-sm font-semibold">Resize</Label>
      <Separator />

      {/* Width */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Width ({params.w}px)
        </label>
        <Slider
          min={320}
          max={3840}
          step={10}
          value={[params.w ?? 1920]}
          onValueChange={([w]) => {
            onProcessingStart()
            onChange({ ...params, w })
          }}
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Height ({params.h}px)
        </label>
        <Slider
          min={240}
          max={2160}
          step={10}
          value={[params.h ?? 1080]}
          onValueChange={([h]) => {
            onProcessingStart()
            onChange({ ...params, h })
          }}
        />
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Quality ({params.q})
        </label>
        <Slider
          min={5}
          max={100}
          step={1}
          value={[params.q ?? 85]}
          onValueChange={([q]) => {
            onProcessingStart()
            onChange({ ...params, q })
          }}
        />
      </div>

      <Separator />

      {/* Crop */}
      <Label className="text-sm font-semibold">Crop</Label>
      <Separator />

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Crop Width ({params.cw ?? "off"}px)
        </label>
        <Slider
          min={0}
          max={3840}
          step={10}
          value={[params.cw ?? 0]}
          onValueChange={([cw]) => {
            onProcessingStart()
            onChange({ ...params, cw: cw || undefined })
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Crop Height ({params.ch ?? "off"}px)
        </label>
        <Slider
          min={0}
          max={2160}
          step={10}
          value={[params.ch ?? 0]}
          onValueChange={([ch]) => {
            onProcessingStart()
            onChange({ ...params, ch: ch || undefined })
          }}
        />
      </div>

      {params.cw && params.ch && (
        <div className="flex gap-2 items-center">
          <Label className="text-xs">Gravity:</Label>
          <Select
            value={params.gravity ?? "center"}
            onValueChange={(gravity) => {
              onProcessingStart()
              onChange({ ...params, gravity })
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRAVITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* Format */}
      <div className="flex gap-2">
        <Label className="text-sm font-medium">Format : </Label>
          <Select
            value={params.format}
            onValueChange={(format) => {
            onProcessingStart()
            onChange({ ...params, format })
            }}
          >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Effects */}
      <Label className="text-sm font-semibold">Effects</Label>
      <Separator />

      {/* Blur */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Blur ({params.blur ?? 0})
        </label>
        <Slider
          min={0}
          max={20}
          step={0.5}
          value={[params.blur ?? 0]}
          onValueChange={([blur]) => {
            onProcessingStart()
            onChange({ ...params, blur: blur || undefined })
          }}
        />
      </div>

      {/* Grayscale */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            onProcessingStart()
            onChange({ ...params, grayscale: params.grayscale ? undefined : true })
          }}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            params.grayscale
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Grayscale
        </button>
      </div>

      <Separator />

      {/* Reset */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          onProcessingStart()
          onChange({
            w: 1920,
            h: 1080,
            q: 85,
            format: "jpeg",
            blur: undefined,
            grayscale: undefined,
            cw: undefined,
            ch: undefined,
            gravity: undefined,
          })
        }}
      >
        Reset
      </Button>
    </Card>
    );
}