import * as React from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  List,
  ListOrdered,
  Palette,
  Ruler,
  Type,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';

/**
 * Controls for page layout, visual styling, and persistence preferences. This
 * panel keeps the editing experience aligned with brand guidelines while
 * exposing power-user toggles such as autosave and grid guides.
 */
export function PropertiesPanel() {
  const template = useAppStore((state) => state.template);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const styles = template.styles;
  const zoom = useAppStore((state) => state.zoom);
  const setZoom = useAppStore((state) => state.setZoom);
  const showGrid = useAppStore((state) => state.showGrid);
  const toggleGrid = useAppStore((state) => state.toggleGrid);
  const autosaveEnabled = useAppStore((state) => state.preferences.autosave);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  const applyStyles = React.useCallback(
    (next: Partial<typeof styles>) => {
      updateTemplate({ styles: next });
    },
    [updateTemplate],
  );

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    updateTemplate({
      page: {
        ...template.page,
        margins: { ...template.page.margins, [side]: value },
      },
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Tabs defaultValue="layout" className="flex h-full flex-col">
        <TabsList className="w-full justify-start">
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
                <div className="flex items-center gap-2">
                  <span>{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={handleResetZoom}>
                    Reset
                  </Button>
                </div>
              </div>
              <Slider
                value={[zoom * 100]}
                onValueChange={(value) => setZoom((value[0] ?? zoom * 100) / 100)}
                min={50}
                max={200}
                step={10}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <span>Autosave</span>
              <Button
                variant={autosaveEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => updatePreferences({ autosave: !autosaveEnabled })}
              >
                {autosaveEnabled ? 'On' : 'Off'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="style" className="space-y-4 pr-1">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font family</Label>
              <Input
                id="fontFamily"
                value={styles.fontFamily}
                onChange={(event) => applyStyles({ fontFamily: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <ToggleGroup
                type="single"
                value={styles.theme}
                onValueChange={(value) => value && applyStyles({ theme: value as 'light' | 'dark' })}
              >
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </TabsContent>
          <TabsContent value="document" className="space-y-5 pr-1">
            <div className="space-y-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bodyFontFamily">Body font</Label>
                  <Input
                    id="bodyFontFamily"
                    value={styles.fontFamily}
                    onChange={(event) => applyStyles({ fontFamily: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headingFontFamily">Heading font</Label>
                  <Input
                    id="headingFontFamily"
                    value={styles.headingFontFamily}
                    onChange={(event) => applyStyles({ headingFontFamily: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Font size</span>
                    <span>{styles.baseFontSize}px</span>
                  </div>
                  <Slider
                    value={[styles.baseFontSize]}
                    onValueChange={(value) =>
                      applyStyles({ baseFontSize: value[0] ? Math.round(value[0]) : styles.baseFontSize })
                    }
                    min={10}
                    max={36}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Line height</span>
                    <span>{styles.lineHeight.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[styles.lineHeight]}
                    onValueChange={(value) =>
                      applyStyles({ lineHeight: Number((value[0] ?? styles.lineHeight).toFixed(2)) })
                    }
                    min={1}
                    max={2.5}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Letter spacing</span>
                    <span>{styles.letterSpacing.toFixed(1)}px</span>
                  </div>
                  <Slider
                    value={[styles.letterSpacing]}
                    onValueChange={(value) =>
                      applyStyles({ letterSpacing: Number((value[0] ?? styles.letterSpacing).toFixed(1)) })
                    }
                    min={-1}
                    max={5}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Paragraph spacing</span>
                    <span>{styles.paragraphSpacing}px</span>
                  </div>
                  <Slider
                    value={[styles.paragraphSpacing]}
                    onValueChange={(value) =>
                      applyStyles({ paragraphSpacing: Math.round(value[0] ?? styles.paragraphSpacing) })
                    }
                    min={4}
                    max={64}
                    step={2}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
              <div>
                <Label className="text-xs uppercase tracking-wide text-slate-400">Paragraph alignment</Label>
                <ToggleGroup
                  type="single"
                  value={styles.paragraphAlign}
                  onValueChange={(value) =>
                    value && applyStyles({ paragraphAlign: value as typeof styles.paragraphAlign })
                  }
                  className="mt-2 grid grid-cols-4 gap-2"
                >
                  <ToggleGroupItem value="left" aria-label="Align left">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center">
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="justify" aria-label="Justify">
                    <AlignJustify className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-slate-400">Body case</Label>
                <ToggleGroup
                  type="single"
                  value={styles.textTransform}
                  onValueChange={(value) =>
                    value && applyStyles({ textTransform: value as typeof styles.textTransform })
                  }
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="none">Normal</ToggleGroupItem>
                  <ToggleGroupItem value="capitalize">Title</ToggleGroupItem>
                  <ToggleGroupItem value="uppercase">Upper</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-400">Heading weight</Label>
                <ToggleGroup
                  type="single"
                  value={styles.headingWeight}
                  onValueChange={(value) =>
                    value && applyStyles({ headingWeight: value as typeof styles.headingWeight })
                  }
                  className="mt-2 grid grid-cols-5 gap-2"
                >
                  <ToggleGroupItem value="400">Regular</ToggleGroupItem>
                  <ToggleGroupItem value="500">Medium</ToggleGroupItem>
                  <ToggleGroupItem value="600">Semi-bold</ToggleGroupItem>
                  <ToggleGroupItem value="700">Bold</ToggleGroupItem>
                  <ToggleGroupItem value="800">Extra</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-400">Heading case</Label>
                <ToggleGroup
                  type="single"
                  value={styles.headingTransform}
                  onValueChange={(value) =>
                    value && applyStyles({ headingTransform: value as typeof styles.headingTransform })
                  }
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="none">Normal</ToggleGroupItem>
                  <ToggleGroupItem value="capitalize">Title</ToggleGroupItem>
                  <ToggleGroupItem value="uppercase">Upper</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Palette</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Body text</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styles.textColor}
                      onChange={(event) => applyStyles({ textColor: event.target.value })}
                      className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-slate-600"
                      aria-label="Body text color"
                    />
                    <span className="text-xs text-slate-500">{styles.textColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Headings</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styles.headingColor}
                      onChange={(event) => applyStyles({ headingColor: event.target.value })}
                      className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-slate-600"
                      aria-label="Heading color"
                    />
                    <span className="text-xs text-slate-500">{styles.headingColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Links</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styles.linkColor}
                      onChange={(event) => applyStyles({ linkColor: event.target.value })}
                      className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-slate-600"
                      aria-label="Link color"
                    />
                    <span className="text-xs text-slate-500">{styles.linkColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Highlight</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styles.highlightColor}
                      onChange={(event) => applyStyles({ highlightColor: event.target.value })}
                      className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-slate-600"
                      aria-label="Highlight color"
                    />
                    <span className="text-xs text-slate-500">{styles.highlightColor}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
              <div>
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <List className="h-4 w-4" /> Bullets
                </Label>
                <ToggleGroup
                  type="single"
                  value={styles.bulletStyle}
                  onValueChange={(value) =>
                    value && applyStyles({ bulletStyle: value as typeof styles.bulletStyle })
                  }
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="disc">Disc</ToggleGroupItem>
                  <ToggleGroupItem value="circle">Circle</ToggleGroupItem>
                  <ToggleGroupItem value="square">Square</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <ListOrdered className="h-4 w-4" /> Numbering
                </Label>
                <ToggleGroup
                  type="single"
                  value={styles.numberedStyle}
                  onValueChange={(value) =>
                    value && applyStyles({ numberedStyle: value as typeof styles.numberedStyle })
                  }
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="decimal">1.</ToggleGroupItem>
                  <ToggleGroupItem value="lower-alpha">a.</ToggleGroupItem>
                  <ToggleGroupItem value="upper-roman">I.</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

