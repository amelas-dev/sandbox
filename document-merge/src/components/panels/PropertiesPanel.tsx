import * as React from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowUpDown,
  CaseSensitive,
  ChevronDown,
  List,
  ListOrdered,
  Palette,
  Ruler,
  StretchHorizontal,
  Type,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import type { BulletStyle, NumberedStyle, ParagraphAlignment, TextTransformOption } from '@/lib/types';
import { GOOGLE_FONT_FAMILIES, GOOGLE_FONT_PRESETS, FONT_PRESET_STACKS } from '@/lib/font-presets';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
import { cn } from '@/lib/utils';

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

function extractPrimaryFamily(fontStack: string): string {
  if (!fontStack) {
    return '';
  }
  const first = fontStack.split(',')[0]?.trim() ?? '';
  return first.replace(/^['"]/,'').replace(/['"]$/, '');
}

function fontLabelFromStack(stack: string): string {
  if (!stack) {
    return 'Custom';
  }
  const preset = GOOGLE_FONT_PRESETS.find((font) => font.stack === stack);
  return preset ? preset.label : 'Custom';
}

const toolbarButtonClass = 'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';

interface ToolbarTriggerOptions {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

const renderToolbarTrigger = ({ icon, label, active, disabled }: ToolbarTriggerOptions) => (
  <Button
    variant='ghost'
    size='sm'
    disabled={disabled}
    className={cn(toolbarButtonClass, active && 'border-brand-500 text-brand-600 dark:border-brand-400/80 dark:text-brand-300')}
  >
    <span className='flex items-center gap-1'>
      {icon}
      <span>{label}</span>
    </span>
    <ChevronDown className='ml-1 h-3 w-3 opacity-60' />
  </Button>
);

const renderSliderSection = (title: string, valueLabel: string, slider: React.ReactNode) => (
  <div className='space-y-2'>
    <div className='flex items-center justify-between text-xs text-slate-500 dark:text-slate-400'>
      <span>{title}</span>
      <span>{valueLabel}</span>
    </div>
    {slider}
  </div>
);


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
      const primary = extractPrimaryFamily(next);
      if (primary) {
        ensureGoogleFontsLoaded([primary]);
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

  const selectionFontPresetLabel =
    selectionFontPresetValue === '__default__'
      ? 'Default'
      : selectionFontPresetValue === 'custom'
        ? 'Custom'
        : fontLabelFromStack(selectionFontPresetValue);
  const selectionFontButtonActive = selectionFontPresetValue !== '__default__';
  const selectionFontSizeLabel = `${selectionFontSize}px`;
  const selectionLetterSpacingLabel = `${selectionLetterSpacingDisplay.toFixed(1)}px`;
  const selectionCaseLabel =
    selectionTextTransformValue === ''
      ? 'Default'
      : selectionTextTransformValue === 'none'
        ? 'Normal'
        : selectionTextTransformValue === 'capitalize'
          ? 'Title'
          : 'Upper';

  const bodyFontLabel = fontLabelFromStack(styles.fontFamily);
  const headingFontLabel = fontLabelFromStack(styles.headingFontFamily);
  const headingWeightLabel = (() => {
    switch (styles.headingWeight) {
      case '400':
        return 'Regular';
      case '500':
        return 'Medium';
      case '600':
        return 'Semi';
      case '700':
        return 'Bold';
      case '800':
      default:
        return 'Extra';
    }
  })();
  const paragraphAlignLabel = (() => {
    switch (styles.paragraphAlign) {
      case 'left':
        return 'Align left';
      case 'center':
        return 'Center';
      case 'right':
        return 'Align right';
      case 'justify':
      default:
        return 'Justify';
    }
  })();
  const bodyCaseLabel = styles.textTransform === 'none' ? 'Normal' : styles.textTransform === 'capitalize' ? 'Title' : 'Upper';
  const headingCaseLabel = styles.headingTransform === 'none' ? 'Normal' : styles.headingTransform === 'capitalize' ? 'Title' : 'Upper';
  const baseFontSizeLabel = `${styles.baseFontSize}px`;
  const lineHeightLabel = styles.lineHeight.toFixed(2);
  const templateLetterSpacingLabel = `${styles.letterSpacing.toFixed(1)}px`;
  const paragraphSpacingLabel = `${styles.paragraphSpacing}px`;

  const handleBodyFontPresetSelect = React.useCallback(
    (value: string) => {
      applyStyles({ fontFamily: value });
      const primary = extractPrimaryFamily(value);
      if (primary) {
        ensureGoogleFontsLoaded([primary]);
      }
    },
    [applyStyles],
  );

  const handleHeadingFontPresetSelect = React.useCallback(
    (value: string) => {
      applyStyles({ headingFontFamily: value });
      const primary = extractPrimaryFamily(value);
      if (primary) {
        ensureGoogleFontsLoaded([primary]);
      }
    },
    [applyStyles],
  );

  const handleTemplateBulletStyleChange = React.useCallback(
    (value: BulletStyle) => {
      applyStyles({ bulletStyle: value });
    },
    [applyStyles],
  );

  const handleTemplateNumberStyleChange = React.useCallback(
    (value: NumberedStyle) => {
      applyStyles({ numberedStyle: value });
    },
    [applyStyles],
  );

  const selectionAlign = editor
    ? (['left', 'center', 'right', 'justify'] as const).find((value) => editor.isActive({ textAlign: value })) ?? styles.paragraphAlign
    : styles.paragraphAlign;


const bulletStyleLabel = styles.bulletStyle.replace(/^(.)/, (match) => match.toUpperCase());
const numberedStyleLabel = styles.numberedStyle === 'decimal'
  ? '1.'
  : styles.numberedStyle === 'lower-alpha'
    ? 'a.'
    : 'I.';

const selectionFontDropdown = selectionControlsDisabled ? null : (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <Type className='h-4 w-4' />,
        label: selectionFontPresetLabel,
        active: selectionFontButtonActive,
        disabled: selectionControlsDisabled,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-64 space-y-2 p-2'>
      <DropdownMenuLabel>Font family</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => handleSelectionFontFamilyChange('')}>
        Document default ({bodyFontLabel})
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <div className='max-h-48 overflow-y-auto'>
        {GOOGLE_FONT_PRESETS.map((font) => (
          <DropdownMenuItem
            key={font.stack}
            onSelect={() => handleSelectionFontFamilyChange(font.stack)}
            className='flex items-center gap-2'
            style={{ fontFamily: font.stack }}
          >
            {font.label}
          </DropdownMenuItem>
        ))}
      </div>
      <DropdownMenuSeparator />
      <div className='space-y-1'>
        <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Custom stack</span>
        <Input
          value={selectionFontFamily}
          placeholder='Enter custom font stack'
          disabled={selectionControlsDisabled}
          onChange={(event) => handleSelectionFontFamilyChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);

const selectionSizeDropdown = selectionControlsDisabled ? null : (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <ArrowUpDown className='h-4 w-4' />,
        label: selectionFontSizeLabel,
        active: selectionFontSize !== styles.baseFontSize,
        disabled: selectionControlsDisabled,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Font size',
        selectionFontSizeLabel,
        <Slider
          value={[selectionFontSize]}
          onValueChange={(value) =>
            handleSelectionFontSizeChange(value[0] ?? selectionFontSize)
          }
          min={8}
          max={72}
          step={1}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const selectionLetterSpacingDropdown = selectionControlsDisabled ? null : (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <StretchHorizontal className='h-4 w-4' />,
        label: selectionLetterSpacingLabel,
        active: selectionLetterSpacingDisplay !== defaultLetterSpacingDisplay,
        disabled: selectionControlsDisabled,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Letter spacing',
        selectionLetterSpacingLabel,
        <Slider
          value={[selectionLetterSpacingDisplay]}
          onValueChange={(value) =>
            handleSelectionLetterSpacingChange(value[0] ?? selectionLetterSpacingDisplay)
          }
          min={-1}
          max={5}
          step={0.1}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const selectionCaseDropdown = selectionControlsDisabled ? null : (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <CaseSensitive className='h-4 w-4' />,
        label: selectionCaseLabel,
        active: selectionTextTransformValue !== '',
        disabled: selectionControlsDisabled,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-44 p-2'>
      <DropdownMenuRadioGroup
        value={selectionTextTransformValue || '__default__'}
        onValueChange={(value) =>
          handleSelectionTransformChange(value === '__default__' ? '' : (value as TextTransformOption))
        }
      >
        <DropdownMenuRadioItem value='__default__'>Document default</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='none'>Normal</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='capitalize'>Title Case</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='uppercase'>Uppercase</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const selectionAlignmentGroup = selectionControlsDisabled ? null : (
  <ToggleGroup
    type='single'
    value={selectionAlign}
    onValueChange={(value) => handleSelectionAlignChange(value as ParagraphAlignment)}
    className='flex items-center gap-1'
  >
    <ToggleGroupItem value='left' aria-label='Align left' className='h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700'>
      <AlignLeft className='h-4 w-4' />
    </ToggleGroupItem>
    <ToggleGroupItem value='center' aria-label='Align center' className='h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700'>
      <AlignCenter className='h-4 w-4' />
    </ToggleGroupItem>
    <ToggleGroupItem value='right' aria-label='Align right' className='h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700'>
      <AlignRight className='h-4 w-4' />
    </ToggleGroupItem>
    <ToggleGroupItem value='justify' aria-label='Justify' className='h-9 rounded-lg border border-slate-200 px-2 dark:border-slate-700'>
      <AlignJustify className='h-4 w-4' />
    </ToggleGroupItem>
  </ToggleGroup>
);

const documentBodyFontDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <Type className='h-4 w-4' />,
        label: bodyFontLabel,
        active: !FONT_PRESET_STACKS.has(styles.fontFamily),
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-64 space-y-2 p-2'>
      <DropdownMenuLabel>Body font</DropdownMenuLabel>
      <div className='max-h-48 overflow-y-auto'>
        {GOOGLE_FONT_PRESETS.map((font) => (
          <DropdownMenuItem
            key={font.stack}
            onSelect={() => handleBodyFontPresetSelect(font.stack)}
            className='flex items-center gap-2'
            style={{ fontFamily: font.stack }}
          >
            {font.label}
          </DropdownMenuItem>
        ))}
      </div>
      <DropdownMenuSeparator />
      <div className='space-y-1'>
        <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Custom stack</span>
        <Input
          value={styles.fontFamily}
          onChange={(event) => applyStyles({ fontFamily: event.target.value })}
          placeholder='Enter custom font stack'
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentHeadingFontDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <Type className='h-4 w-4' />,
        label: headingFontLabel,
        active: !FONT_PRESET_STACKS.has(styles.headingFontFamily),
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-64 space-y-2 p-2'>
      <DropdownMenuLabel>Heading font</DropdownMenuLabel>
      <div className='max-h-48 overflow-y-auto'>
        {GOOGLE_FONT_PRESETS.map((font) => (
          <DropdownMenuItem
            key={font.stack}
            onSelect={() => handleHeadingFontPresetSelect(font.stack)}
            className='flex items-center gap-2'
            style={{ fontFamily: font.stack }}
          >
            {font.label}
          </DropdownMenuItem>
        ))}
      </div>
      <DropdownMenuSeparator />
      <div className='space-y-1'>
        <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Custom stack</span>
        <Input
          value={styles.headingFontFamily}
          onChange={(event) => applyStyles({ headingFontFamily: event.target.value })}
          placeholder='Enter custom font stack'
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentFontSizeDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <ArrowUpDown className='h-4 w-4' />,
        label: baseFontSizeLabel,
        active: false,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Base font size',
        baseFontSizeLabel,
        <Slider
          value={[styles.baseFontSize]}
          onValueChange={(value) =>
            applyStyles({ baseFontSize: value[0] ? Math.round(value[0]) : styles.baseFontSize })
          }
          min={10}
          max={36}
          step={1}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentLineHeightDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <ArrowUpDown className='h-4 w-4 rotate-90' />,
        label: lineHeightLabel,
        active: false,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Line height',
        lineHeightLabel,
        <Slider
          value={[styles.lineHeight]}
          onValueChange={(value) =>
            applyStyles({ lineHeight: Number((value[0] ?? styles.lineHeight).toFixed(2)) })
          }
          min={1}
          max={2.5}
          step={0.05}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentLetterSpacingDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <StretchHorizontal className='h-4 w-4' />,
        label: templateLetterSpacingLabel,
        active: styles.letterSpacing !== 0,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Letter spacing',
        templateLetterSpacingLabel,
        <Slider
          value={[styles.letterSpacing]}
          onValueChange={(value) =>
            applyStyles({ letterSpacing: Number((value[0] ?? styles.letterSpacing).toFixed(1)) })
          }
          min={-1}
          max={5}
          step={0.1}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentParagraphSpacingDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <Ruler className='h-4 w-4' />,
        label: paragraphSpacingLabel,
        active: false,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56 space-y-3 p-3'>
      {renderSliderSection(
        'Paragraph spacing',
        paragraphSpacingLabel,
        <Slider
          value={[styles.paragraphSpacing]}
          onValueChange={(value) =>
            applyStyles({ paragraphSpacing: Math.round(value[0] ?? styles.paragraphSpacing) })
          }
          min={4}
          max={64}
          step={2}
        />,
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentParagraphAlignDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <AlignLeft className='h-4 w-4' />,
        label: paragraphAlignLabel,
        active: false,
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-48 p-2'>
      <DropdownMenuRadioGroup
        value={styles.paragraphAlign}
        onValueChange={(value) => applyStyles({ paragraphAlign: value as ParagraphAlignment })}
      >
        <DropdownMenuRadioItem value='left'>Align left</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='center'>Center</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='right'>Align right</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='justify'>Justify</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const bodyCaseDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <CaseSensitive className='h-4 w-4' />,
        label: bodyCaseLabel,
        active: styles.textTransform !== 'none',
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-44 p-2'>
      <DropdownMenuRadioGroup
        value={styles.textTransform}
        onValueChange={(value) => applyStyles({ textTransform: value as TextTransformOption })}
      >
        <DropdownMenuRadioItem value='none'>Normal</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='capitalize'>Title Case</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='uppercase'>Uppercase</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const headingCaseDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <CaseSensitive className='h-4 w-4' />,
        label: headingCaseLabel,
        active: styles.headingTransform !== 'none',
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-44 p-2'>
      <DropdownMenuRadioGroup
        value={styles.headingTransform}
        onValueChange={(value) => applyStyles({ headingTransform: value as TextTransformOption })}
      >
        <DropdownMenuRadioItem value='none'>Normal</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='capitalize'>Title Case</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='uppercase'>Uppercase</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const headingWeightDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <Type className='h-4 w-4' />,
        label: headingWeightLabel,
        active: styles.headingWeight !== '700',
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-44 p-2'>
      <DropdownMenuRadioGroup
        value={styles.headingWeight}
        onValueChange={(value) => applyStyles({ headingWeight: value as typeof styles.headingWeight })}
      >
        <DropdownMenuRadioItem value='400'>Regular</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='500'>Medium</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='600'>Semi Bold</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='700'>Bold</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='800'>Extra Bold</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentBulletStyleDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <List className='h-4 w-4' />,
        label: bulletStyleLabel,
        active: styles.bulletStyle !== 'disc',
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-40 p-2'>
      <DropdownMenuRadioGroup
        value={styles.bulletStyle}
        onValueChange={(value) => handleTemplateBulletStyleChange(value as BulletStyle)}
      >
        <DropdownMenuRadioItem value='disc'>Disc</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='circle'>Circle</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='square'>Square</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const documentNumberStyleDropdown = (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {renderToolbarTrigger({
        icon: <ListOrdered className='h-4 w-4' />,
        label: numberedStyleLabel,
        active: styles.numberedStyle !== 'decimal',
      })}
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-40 p-2'>
      <DropdownMenuRadioGroup
        value={styles.numberedStyle}
        onValueChange={(value) => handleTemplateNumberStyleChange(value as NumberedStyle)}
      >
        <DropdownMenuRadioItem value='decimal'>1.</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='lower-alpha'>a.</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='upper-roman'>I.</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const selectionToolbar = (
  <div className='space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <div className='flex flex-wrap items-center gap-2'>
      {selectionFontDropdown}
      {selectionSizeDropdown}
      {selectionLetterSpacingDropdown}
      {selectionCaseDropdown}
      <Separator orientation='vertical' className='hidden h-6 sm:block' />
      {selectionAlignmentGroup}
      <Button
        variant='ghost'
        size='sm'
        onClick={clearSelectionOverrides}
        disabled={selectionControlsDisabled || !hasSelectionOverrides}
        className='rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        Reset
      </Button>
    </div>
    <p className='text-xs text-slate-500 dark:text-slate-400'>
      {selectionControlsDisabled
        ? 'Switch to edit mode to format document content.'
        : selectionActive
          ? 'Formatting applies to the highlighted text.'
          : 'Formatting applies to the next text you type.'}
    </p>
  </div>
);

const documentToolbar = (
  <div className='space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <div className='flex flex-wrap items-center gap-2'>
      {documentBodyFontDropdown}
      {documentHeadingFontDropdown}
      <Separator orientation='vertical' className='hidden h-6 sm:block' />
      {documentFontSizeDropdown}
      {documentLineHeightDropdown}
      {documentLetterSpacingDropdown}
      {documentParagraphSpacingDropdown}
      <Separator orientation='vertical' className='hidden h-6 sm:block' />
      {documentParagraphAlignDropdown}
      {bodyCaseDropdown}
      {headingCaseDropdown}
      {headingWeightDropdown}
      {documentBulletStyleDropdown}
      {documentNumberStyleDropdown}
    </div>
  </div>
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
            {selectionToolbar}
            {documentToolbar}
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

