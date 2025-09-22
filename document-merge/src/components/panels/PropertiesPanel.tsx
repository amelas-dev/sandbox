import * as React from 'react';
import type { Editor } from '@tiptap/core';
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
import type { BulletStyle, NumberedStyle, ParagraphAlignment, TextTransformOption } from '@/lib/types';
import { GOOGLE_FONT_FAMILIES, GOOGLE_FONT_PRESETS, FONT_PRESET_STACKS } from '@/lib/font-presets';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';

interface PropertiesPanelProps {
  editor: Editor | null;
}

function parsePxValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.replace('px', '').trim());
    if (Number.isFinite(numeric)) {
      return Math.round(numeric);
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return undefined;
}

function px(value: number) {
  return `${value}px`;
}

const selectControlClasses =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';


/**
 * Controls for page layout, visual styling, and persistence preferences. This
 * panel keeps the editing experience aligned with brand guidelines while
 * exposing power-user toggles such as autosave and grid guides.
 */
export function PropertiesPanel({ editor }: PropertiesPanelProps) {
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

  React.useEffect(() => {
    ensureGoogleFontsLoaded(GOOGLE_FONT_FAMILIES);
  }, []);

  const [, forceSelectionUpdate] = React.useReducer((count: number) => count + 1, 0);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const handleUpdate = () => forceSelectionUpdate();
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, forceSelectionUpdate]);

  const textStyleAttributes = (editor?.getAttributes('textStyle') ?? {}) as Record<string, unknown>;
  const selectionActive = Boolean(editor?.state.selection && !editor.state.selection.empty);
  const selectionFontFamily =
    typeof textStyleAttributes.fontFamily === 'string' ? (textStyleAttributes.fontFamily as string) : '';
  const selectionFontSize = parsePxValue(textStyleAttributes.fontSize) ?? styles.baseFontSize;
  const selectionLetterSpacingValue = (() => {
    const raw = textStyleAttributes.letterSpacing;
    return parseNumber(raw) ?? parsePxValue(raw) ?? styles.letterSpacing;
  })();
  const selectionTextTransformValue =
    typeof textStyleAttributes.textTransform === 'string'
      ? (textStyleAttributes.textTransform as string)
      : '';

  const selectionLetterSpacingDisplay = Number(selectionLetterSpacingValue.toFixed(1));

  const defaultLetterSpacingDisplay = Number(styles.letterSpacing.toFixed(1));
  const hasSelectionOverrides =
    Boolean(selectionFontFamily) ||
    selectionTextTransformValue !== '' ||
    selectionFontSize !== styles.baseFontSize ||
    selectionLetterSpacingDisplay !== defaultLetterSpacingDisplay;
  const selectionControlsDisabled = !editor;
  const bodyFontSelectValue = FONT_PRESET_STACKS.has(styles.fontFamily) ? styles.fontFamily : 'custom';
  const headingFontSelectValue = FONT_PRESET_STACKS.has(styles.headingFontFamily) ? styles.headingFontFamily : 'custom';
  const selectionFontPresetValue = selectionFontFamily
    ? FONT_PRESET_STACKS.has(selectionFontFamily)
      ? selectionFontFamily
      : 'custom'
    : '__default__';


  const handleSelectionFontFamilyChange = React.useCallback(
    (value: string) => {
      if (!editor) {
        return;
      }
      const next = value.trim();
      const chain = editor.chain().focus();
      if (!next) {
        chain.updateAttributes('textStyle', { fontFamily: null }).run();
        return;
      }
      chain.setMark('textStyle', { fontFamily: next }).run();
    },
    [editor],
  );

  const handleSelectionFontSizeChange = React.useCallback(
    (value: number) => {
      if (!editor || Number.isNaN(value)) {
        return;
      }
      editor.chain().focus().setMark('textStyle', { fontSize: px(Math.round(value)) }).run();
    },
    [editor],
  );

  const handleSelectionLetterSpacingChange = React.useCallback(
    (value: number) => {
      if (!editor || Number.isNaN(value)) {
        return;
      }
      const next = Number(value.toFixed(1));
      editor.chain().focus().setMark('textStyle', { letterSpacing: `${next}px` }).run();
    },
    [editor],
  );

  const handleSelectionTransformChange = React.useCallback(
    (value: string) => {
      if (!editor) {
        return;
      }
      const chain = editor.chain().focus();
      if (value === '') {
        chain.updateAttributes('textStyle', { textTransform: null }).run();
        return;
      }
      chain.setMark('textStyle', { textTransform: value as TextTransformOption }).run();
    },
    [editor],
  );

  const handleSelectionAlignChange = React.useCallback(
    (value: ParagraphAlignment | '') => {
      if (!editor || !value) {
        return;
      }
      editor.chain().focus().setTextAlign(value).run();
    },
    [editor],
  );

  const clearSelectionOverrides = React.useCallback(() => {
    if (!editor) {
      return;
    }
    editor.chain().focus().unsetMark('textStyle').run();
  }, [editor]);

  const selectionAlign = editor
    ? (['left', 'center', 'right', 'justify'] as const).find((value) => editor.isActive({ textAlign: value })) ?? styles.paragraphAlign
    : styles.paragraphAlign;

  const bulletListAttributes = (editor?.getAttributes('bulletList') ?? {}) as Record<string, unknown>;
  const orderedListAttributes = (editor?.getAttributes('orderedList') ?? {}) as Record<string, unknown>;
  const activeBulletStyle = (editor && editor.isActive('bulletList')
    ? ((bulletListAttributes.listStyle as BulletStyle | undefined) ?? styles.bulletStyle)
    : styles.bulletStyle);
  const activeNumberedStyle = (editor && editor.isActive('orderedList')
    ? ((orderedListAttributes.listStyle as NumberedStyle | undefined) ?? styles.numberedStyle)
    : styles.numberedStyle);

  const handleBulletStyleChange = React.useCallback(
    (value: BulletStyle | '') => {
      if (!value) {
        return;
      }
      if (editor) {
        const chain = editor.chain().focus();
        if (editor.isActive('bulletList')) {
          chain.updateAttributes('bulletList', { listStyle: value }).run();
        } else {
          chain.toggleBulletList({ listStyle: value }).run();
        }
        return;
      }
      applyStyles({ bulletStyle: value });
    },
    [applyStyles, editor],
  );

  const handleNumberedStyleChange = React.useCallback(
    (value: NumberedStyle | '') => {
      if (!value) {
        return;
      }
      if (editor) {
        const chain = editor.chain().focus();
        if (editor.isActive('orderedList')) {
          chain.updateAttributes('orderedList', { listStyle: value }).run();
        } else {
          chain.toggleOrderedList({ listStyle: value }).run();
        }
        return;
      }
      applyStyles({ numberedStyle: value });
    },
    [applyStyles, editor],
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
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-slate-400">
                    Selection styling
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editor
                      ? selectionActive
                        ? 'Changes apply to the highlighted text.'
                        : 'Changes apply to the next text you type.'
                      : 'Switch to edit mode to format document content.'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={clearSelectionOverrides}
                  disabled={selectionControlsDisabled || !hasSelectionOverrides}
                >
                  Clear overrides
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="selectionFontPreset">Font family</Label>
                  <select
                    id="selectionFontPreset"
                    className={selectControlClasses}
                    value={selectionFontPresetValue}
                    disabled={selectionControlsDisabled}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '__default__') {
                        handleSelectionFontFamilyChange('');
                        return;
                      }
                      if (value === 'custom') {
                        return;
                      }
                      handleSelectionFontFamilyChange(value);
                    }}
                  >
                    <option value="__default__">Document default ({styles.fontFamily})</option>
                    {GOOGLE_FONT_PRESETS.map((font) => (
                      <option key={font.stack} value={font.stack}>
                        {font.label}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {selectionFontPresetValue === 'custom' && (
                    <Input
                      id="selectionFontFamilyCustom"
                      value={selectionFontFamily}
                      placeholder="Enter custom font stack"
                      disabled={selectionControlsDisabled}
                      onChange={(event) => handleSelectionFontFamilyChange(event.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectionTextTransform">Text case</Label>
                  <select
                    id="selectionTextTransform"
                    className={selectControlClasses}
                    value={selectionTextTransformValue}
                    disabled={selectionControlsDisabled}
                    onChange={(event) => handleSelectionTransformChange(event.target.value)}
                  >
                    <option value="">Document default</option>
                    <option value="none">Normal</option>
                    <option value="capitalize">Title Case</option>
                    <option value="uppercase">Uppercase</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Font size</span>
                    <span>{selectionFontSize}px</span>
                  </div>
                  <Slider
                    value={[selectionFontSize]}
                    disabled={selectionControlsDisabled}
                    onValueChange={(value) =>
                      handleSelectionFontSizeChange(value[0] ?? selectionFontSize)
                    }
                    min={8}
                    max={72}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Letter spacing</span>
                    <span>{selectionLetterSpacingDisplay.toFixed(1)}px</span>
                  </div>
                  <Slider
                    value={[selectionLetterSpacingDisplay]}
                    disabled={selectionControlsDisabled}
                    onValueChange={(value) =>
                      handleSelectionLetterSpacingChange(value[0] ?? selectionLetterSpacingDisplay)
                    }
                    min={-1}
                    max={5}
                    step={0.1}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-slate-400">Paragraph alignment</Label>
                <ToggleGroup
                  type="single"
                  value={selectionAlign}
                  onValueChange={(value) => handleSelectionAlignChange(value as ParagraphAlignment)}
                  className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
                  disabled={selectionControlsDisabled}
                >
                  <ToggleGroupItem value="left" aria-label="Align left" className="h-10 justify-center">
                    <AlignLeft className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center" className="h-10 justify-center">
                    <AlignCenter className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right" className="h-10 justify-center">
                    <AlignRight className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="justify" aria-label="Justify" className="h-10 justify-center">
                    <AlignJustify className="h-5 w-5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bodyFontFamily">Body font</Label>
                  <select
                    id="bodyFontFamily"
                    className={selectControlClasses}
                    value={bodyFontSelectValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === 'custom') {
                        return;
                      }
                      applyStyles({ fontFamily: value });
                    }}
                  >
                    {GOOGLE_FONT_PRESETS.map((font) => (
                      <option key={font.stack} value={font.stack}>
                        {font.label}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {bodyFontSelectValue === 'custom' && (
                    <Input
                      id="bodyFontCustom"
                      value={styles.fontFamily}
                      onChange={(event) => applyStyles({ fontFamily: event.target.value })}
                      placeholder="Enter custom font stack"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headingFontFamily">Heading font</Label>
                  <select
                    id="headingFontFamily"
                    className={selectControlClasses}
                    value={headingFontSelectValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === 'custom') {
                        return;
                      }
                      applyStyles({ headingFontFamily: value });
                    }}
                  >
                    {GOOGLE_FONT_PRESETS.map((font) => (
                      <option key={font.stack} value={font.stack}>
                        {font.label}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {headingFontSelectValue === 'custom' && (
                    <Input
                      id="headingFontCustom"
                      value={styles.headingFontFamily}
                      onChange={(event) => applyStyles({ headingFontFamily: event.target.value })}
                      placeholder="Enter custom font stack"
                    />
                  )}
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
                    value && applyStyles({ paragraphAlign: value as ParagraphAlignment })
                  }
                  className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  <ToggleGroupItem value="left" aria-label="Align left" className="h-10 justify-center">
                    <AlignLeft className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center" className="h-10 justify-center">
                    <AlignCenter className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right" className="h-10 justify-center">
                    <AlignRight className="h-5 w-5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="justify" aria-label="Justify" className="h-10 justify-center">
                    <AlignJustify className="h-5 w-5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyCase">Body case</Label>
                <select
                  id="bodyCase"
                  className={selectControlClasses}
                  value={styles.textTransform}
                  onChange={(event) =>
                    applyStyles({ textTransform: event.target.value as TextTransformOption })
                  }
                >
                  <option value="none">Normal</option>
                  <option value="capitalize">Title Case</option>
                  <option value="uppercase">Uppercase</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="headingWeight">Heading weight</Label>
                <select
                  id="headingWeight"
                  className={selectControlClasses}
                  value={styles.headingWeight}
                  onChange={(event) =>
                    applyStyles({ headingWeight: event.target.value as typeof styles.headingWeight })
                  }
                >
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headingCase">Heading case</Label>
                <select
                  id="headingCase"
                  className={selectControlClasses}
                  value={styles.headingTransform}
                  onChange={(event) =>
                    applyStyles({ headingTransform: event.target.value as TextTransformOption })
                  }
                >
                  <option value="none">Normal</option>
                  <option value="capitalize">Title Case</option>
                  <option value="uppercase">Uppercase</option>
                </select>
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
                  value={activeBulletStyle}
                  onValueChange={(value) => handleBulletStyleChange(value as BulletStyle | '')}
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="disc" className="h-10 justify-center">Disc</ToggleGroupItem>
                  <ToggleGroupItem value="circle" className="h-10 justify-center">Circle</ToggleGroupItem>
                  <ToggleGroupItem value="square" className="h-10 justify-center">Square</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <ListOrdered className="h-4 w-4" /> Numbering
                </Label>
                <ToggleGroup
                  type="single"
                  value={activeNumberedStyle}
                  onValueChange={(value) => handleNumberedStyleChange(value as NumberedStyle | '')}
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="decimal" className="h-10 justify-center">1.</ToggleGroupItem>
                  <ToggleGroupItem value="lower-alpha" className="h-10 justify-center">a.</ToggleGroupItem>
                  <ToggleGroupItem value="upper-roman" className="h-10 justify-center">I.</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

