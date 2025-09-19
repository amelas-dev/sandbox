import * as React from 'react';
import { Palette, Ruler, Type } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';

export function PropertiesPanel() {
  const template = useAppStore((state) => state.template);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const zoom = useAppStore((state) => state.zoom);
  const setZoom = useAppStore((state) => state.setZoom);
  const showGrid = useAppStore((state) => state.showGrid);
  const toggleGrid = useAppStore((state) => state.toggleGrid);

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    updateTemplate({
      page: {
        ...template.page,
        margins: { ...template.page.margins, [side]: value },
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Tabs defaultValue="layout" className="flex h-full flex-col">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="layout" className="gap-2">
            <Ruler className="h-4 w-4" /> Layout
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-2">
            <Palette className="h-4 w-4" /> Style
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2">
            <Type className="h-4 w-4" /> Typography
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto pt-1">
          <TabsContent value="layout" className="space-y-4 pr-1">
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-400">Page size</Label>
              <ToggleGroup
                type="single"
                value={template.page.size}
              onValueChange={(value) =>
                value &&
                updateTemplate({
                  page: {
                    ...template.page,
                    size: value as 'Letter' | 'A4',
                  },
                })
              }
              className="mt-2"
            >
              <ToggleGroupItem value="Letter">Letter</ToggleGroupItem>
              <ToggleGroupItem value="A4">A4</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-slate-400">Orientation</Label>
            <ToggleGroup
              type="single"
              value={template.page.orientation}
              onValueChange={(value) =>
                value &&
                updateTemplate({
                  page: {
                    ...template.page,
                    orientation: value as 'portrait' | 'landscape',
                  },
                })
              }
              className="mt-2"
            >
              <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
              <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-slate-400">Margins (pts)</Label>
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <div key={side} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="capitalize">{side}</span>
                  <span>{Math.round(template.page.margins[side])}</span>
                </div>
                <Slider
                  value={[template.page.margins[side]]}
                  onValueChange={(value) => handleMarginChange(side, value[0] ?? template.page.margins[side])}
                  min={24}
                  max={144}
                  step={4}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
            <span>Grid guides</span>
            <Button variant={showGrid ? 'default' : 'outline'} size="sm" onClick={toggleGrid}>
              {showGrid ? 'On' : 'Off'}
            </Button>
          </div>
            <div className="space-y-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom * 100]}
                onValueChange={(value) => setZoom((value[0] ?? zoom * 100) / 100)}
                min={50}
                max={200}
                step={10}
              />
            </div>
          </TabsContent>
          <TabsContent value="style" className="space-y-4 pr-1">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font family</Label>
              <Input
                id="fontFamily"
                value={template.styles.fontFamily}
              onChange={(event) => updateTemplate({ styles: { fontFamily: event.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <ToggleGroup
              type="single"
              value={template.styles.theme}
              onValueChange={(value) => value && updateTemplate({ styles: { theme: value as 'light' | 'dark' } })}
            >
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label>Base font size</Label>
            <Slider
              value={[template.styles.baseFontSize]}
              onValueChange={(value) => updateTemplate({ styles: { baseFontSize: value[0] ?? template.styles.baseFontSize } })}
              min={10}
              max={24}
            />
            <div className="text-xs text-slate-500">{template.styles.baseFontSize}px</div>
            </div>
          </TabsContent>
          <TabsContent value="document" className="space-y-4 pr-1">
            <div className="space-y-2">
              <Label>Heading weight</Label>
              <ToggleGroup type="single" className="mt-1" value="700">
                <ToggleGroupItem value="600">Semi-bold</ToggleGroupItem>
                <ToggleGroupItem value="700">Bold</ToggleGroupItem>
              <ToggleGroupItem value="800">Extra-bold</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-slate-500">
              Heading styles are applied via the toolbar. Customize defaults here to keep branding consistent.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Paragraph spacing</Label>
            <Slider value={[14]} min={8} max={32} disabled />
            <p className="text-xs text-slate-400">Advanced spacing presets coming soon.</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
