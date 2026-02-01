"use client";

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { ProcessParams } from "@/lib/image-process-params";

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

      {/* Format */}
      <div className="flex gap-2">
        <label className="text-sm font-medium">Format</label>
        <Select
          value={params.format}
          onValueChange={(format) =>
            onChange({ ...params, format })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            w: 1920,
            h: 1080,
            q: 85,
            format: "jpeg",
          })
        }
      >
        Reset
      </Button>
    </Card>
    );
}