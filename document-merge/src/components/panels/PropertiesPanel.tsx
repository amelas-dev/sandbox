
import * as React from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart2,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  Minus,
  Palette,
  Plus,
  RefreshCcw,
  Ruler,
  Sparkles,
  Square,
  StretchHorizontal,
  Table as TableIcon,
  Trash2,
  Type as TypeIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { DocumentStylePreset, PageBackgroundOption, ParagraphAlignment, TemplateTypography } from '@/lib/types';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
import { GOOGLE_FONT_FAMILIES, GOOGLE_FONT_PRESETS } from '@/lib/font-presets';
import {
  DEFAULT_TABLE_BORDER_WIDTH,
  DEFAULT_TABLE_CELL_PADDING,
  type PremiumTableAttributes,
} from '@/editor/extensions/premium-table';
import { applyTableSelection, type TableSelectionScope } from '@/lib/editor/tableSelection';
import type { EnhancedImageAttributes, ImageAlignment } from '@/editor/extensions/enhanced-image';
import { DEFAULT_IMAGE_BORDER_COLOR } from '@/editor/extensions/enhanced-image';
import { ImageSourceForm } from '@/components/editor/ImageSourceForm';

interface PropertiesPanelProps {
  editor: Editor | null;
}

type PropertiesTab = 'layout' | 'style' | 'type' | 'comp';

interface FontFamilyDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  onSelectPreset: (stack: string) => void;
  onCustomChange: (value: string) => void;
  disabled?: boolean;
}

const LAYOUT_MARGIN_FIELDS: Array<{ label: string; key: 'top' | 'right' | 'bottom' | 'left' }> = [
  { label: 'Top', key: 'top' },
  { label: 'Right', key: 'right' },
  { label: 'Bottom', key: 'bottom' },
  { label: 'Left', key: 'left' },
];

const STYLE_COLOR_PALETTE = [
  '#0f172a',
  '#1e293b',
  '#2563eb',
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#f472b6',
  '#facc15',
  '#f59e0b',
];

const IMAGE_BORDER_COLORS = Array.from(new Set([DEFAULT_IMAGE_BORDER_COLOR, ...STYLE_COLOR_PALETTE]));

const BACKGROUND_OPTIONS: Array<{ value: PageBackgroundOption; label: string }> = [
  { value: 'white', label: 'White' },
  { value: 'softGray', label: 'Soft Gray' },
  { value: 'linen', label: 'Ivory' },
  { value: 'transparent', label: 'Transparent' },
];

const DOCUMENT_STYLE_PRESETS: Record<DocumentStylePreset, { label: string; styles: Partial<TemplateTypography> }> = {
  professional: {
    label: 'Professional',
    styles: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      headingWeight: '700',
      lineHeight: 1.6,
      paragraphSpacing: 18,
      letterSpacing: 0,
    },
  },
  minimal: {
    label: 'Minimal',
    styles: {
      fontFamily: "'Source Sans Pro', sans-serif",
      headingFontFamily: "'Source Sans Pro', sans-serif",
      headingWeight: '600',
      lineHeight: 1.5,
      paragraphSpacing: 14,
      letterSpacing: 0.2,
    },
  },
  vibrant: {
    label: 'Vibrant',
    styles: {
      fontFamily: "'Poppins', sans-serif",
      headingFontFamily: "'Poppins', sans-serif",
      headingWeight: '600',
      textColor: '#0f172a',
      headingColor: '#1d4ed8',
      linkColor: '#1d4ed8',
      highlightColor: '#bfdbfe',
    },
  },
};

const LINE_SPACING_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

const PARAGRAPH_STYLE_OPTIONS = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading1', label: 'Heading 1' },
  { value: 'heading2', label: 'Heading 2' },
  { value: 'heading3', label: 'Heading 3' },
];

const IMAGE_ALIGNMENT_OPTIONS: Array<{
  value: ImageAlignment;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'inline', label: 'Inline', icon: Square },
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'full', label: 'Full width', icon: StretchHorizontal },
];

type TableWidthMode = 'auto' | 'full' | 'custom';

const DEFAULT_APPEARANCE = {
  background: 'white' as PageBackgroundOption,
  dropShadow: true,
  pageBorder: true,
  stylePreset: 'professional' as DocumentStylePreset,
};

function parsePxValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.replace('px', '').trim());
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number.parseFloat(value.trim());
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return undefined;
}

function FontFamilyDropdown({ label, value, placeholder, onSelectPreset, onCustomChange, disabled }: FontFamilyDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='w-full justify-between rounded-xl border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
          disabled={disabled}
        >
          <span className='flex items-center gap-2 text-slate-600 dark:text-slate-300'>
            <TypeIcon className='h-4 w-4 opacity-70' />
            <span>{value || label}</span>
          </span>
          <ChevronDown className='h-4 w-4 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64 space-y-2 p-2'>
        <DropdownMenuLabel>Select font</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSelectPreset('')}>{placeholder}</DropdownMenuItem>
        <Separator />
        <div className='max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800'>
          {GOOGLE_FONT_PRESETS.map((font) => (
            <DropdownMenuItem
              key={font.stack}
              onSelect={() => onSelectPreset(font.stack)}
              className='flex items-center gap-2'
              style={{ fontFamily: font.stack }}
            >
              {font.label}
            </DropdownMenuItem>
          ))}
        </div>
        <Separator />
        <div className='space-y-1'>
          <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Custom stack</span>
          <Input
            value={value}
            onChange={(event) => onCustomChange(event.target.value)}
            placeholder='Enter custom font stack'
            disabled={disabled}
            className='h-9 rounded-lg border-slate-200 text-sm dark:border-slate-700'
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function normalizeWidthInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'auto';
  }
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed}%`;
  }
  return trimmed;
}
export function PropertiesPanel({ editor }: PropertiesPanelProps) {
  const template = useAppStore((state) => state.template);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const styles = template.styles;
  const appearance = template.appearance ?? DEFAULT_APPEARANCE;
  const zoom = useAppStore((state) => state.zoom);
  const setZoom = useAppStore((state) => state.setZoom);
  const showGrid = useAppStore((state) => state.showGrid);
  const toggleGrid = useAppStore((state) => state.toggleGrid);
  const autosaveEnabled = useAppStore((state) => state.preferences.autosave);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  const applyStyles = React.useCallback(
    (next: Partial<TemplateTypography>) => {
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
    selectionActive && typeof textStyleAttributes.fontFamily === 'string'
      ? (textStyleAttributes.fontFamily as string)
      : '';
  const selectionFontSize = selectionActive
    ? parsePxValue(textStyleAttributes.fontSize) ?? styles.baseFontSize
    : styles.baseFontSize;
  const selectionLineHeight = selectionActive
    ? parseNumber(textStyleAttributes.lineHeight) ?? styles.lineHeight
    : styles.lineHeight;
  const selectionColorValue =
    selectionActive && typeof textStyleAttributes.color === 'string'
      ? (textStyleAttributes.color as string)
      : '';

  const selectionBoldActive = editor?.isActive('bold') ?? false;
  const selectionItalicActive = editor?.isActive('italic') ?? false;
  const selectionUnderlineActive = editor?.isActive('underline') ?? false;

  const paragraphStyleValue = (() => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'heading1';
    if (editor.isActive('heading', { level: 2 })) return 'heading2';
    if (editor.isActive('heading', { level: 3 })) return 'heading3';
    return 'paragraph';
  })();

  const selectionDisabled = !editor || !selectionActive;

  const selectionFontPresetLabel = selectionFontFamily
    ? GOOGLE_FONT_PRESETS.find((font) => font.stack === selectionFontFamily)?.label ?? 'Custom'
    : 'Default';

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
      ensureGoogleFontsLoaded([next.split(',')[0]?.replace(/['"]+/g, '').trim()].filter(Boolean));
      chain.setMark('textStyle', { fontFamily: next }).run();
    },
    [editor],
  );

  const handleSelectionFontSizeChange = React.useCallback(
    (value: number) => {
      if (!editor || Number.isNaN(value)) {
        return;
      }
      editor.chain().focus().setMark('textStyle', { fontSize: `${Math.round(value)}px` }).run();
    },
    [editor],
  );

  const handleSelectionLineHeightChange = React.useCallback(
    (value: number) => {
      if (!editor || Number.isNaN(value)) {
        return;
      }
      editor.chain().focus().setMark('textStyle', { lineHeight: value.toFixed(2) }).run();
    },
    [editor],
  );

  const handleParagraphStyleChange = React.useCallback(
    (value: string) => {
      if (!editor) return;
      const chain = editor.chain().focus();
      switch (value) {
        case 'heading1':
          chain.setHeading({ level: 1 }).run();
          break;
        case 'heading2':
          chain.setHeading({ level: 2 }).run();
          break;
        case 'heading3':
          chain.setHeading({ level: 3 }).run();
          break;
        default:
          chain.setParagraph().run();
      }
    },
    [editor],
  );

  const handleSelectAlignment = React.useCallback(
    (value: ParagraphAlignment) => {
      if (!editor) return;
      editor.chain().focus().setTextAlign(value).run();
    },
    [editor],
  );

  const toggleMark = React.useCallback(
    (mark: 'bold' | 'italic' | 'underline') => {
      if (!editor) return;
      const chain = editor.chain().focus();
      switch (mark) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          chain.toggleUnderline().run();
          break;
      }
    },
    [editor],
  );

  const handleSelectionColor = React.useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
    },
    [editor],
  );

  const handleSelectionColorClear = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
  }, [editor]);

  const [customThemeColor, setCustomThemeColor] = React.useState(styles.textColor);

  React.useEffect(() => {
    setCustomThemeColor(styles.textColor);
  }, [styles.textColor]);

  const applyThemeColor = React.useCallback(
    (color: string) => {
      applyStyles({
        textColor: color,
        headingColor: color,
        linkColor: color,
      });
    },
    [applyStyles],
  );

  const handleCustomThemeColor = (value: string) => {
    setCustomThemeColor(value);
    applyThemeColor(value);
  };

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark') {
      applyStyles({ theme: value });
    }
  };

  const handleBackgroundChange = (value: PageBackgroundOption) => {
    updateTemplate({ appearance: { background: value } });
  };

  const handleDocumentStyleChange = (preset: DocumentStylePreset) => {
    const presetConfig = DOCUMENT_STYLE_PRESETS[preset];
    updateTemplate({ appearance: { stylePreset: preset }, styles: presetConfig.styles });
    const families = [presetConfig.styles.fontFamily, presetConfig.styles.headingFontFamily]
      .map((stack) => (typeof stack === 'string' ? stack.split(',')[0]?.replace(/['"]+/g, '').trim() : ''))
      .filter((item): item is string => Boolean(item && item.length));
    if (families.length) {
      ensureGoogleFontsLoaded(families);
    }
  };

  const handleToggleDropShadow = () => {
    updateTemplate({ appearance: { dropShadow: !appearance.dropShadow } });
  };

  const handleTogglePageBorder = () => {
    updateTemplate({ appearance: { pageBorder: !appearance.pageBorder } });
  };

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', raw: string) => {
    const numeric = Number.parseInt(raw, 10);
    if (Number.isNaN(numeric)) {
      return;
    }
    updateTemplate({
      page: {
        ...template.page,
        margins: { ...template.page.margins, [side]: Math.max(12, numeric) },
      },
    });
  };

  const handleZoomSlider = (value: number[]) => {
    const next = value[0] ?? zoom * 100;
    setZoom(Math.max(0.5, Math.min(2, next / 100)));
  };

  const handleResetZoom = () => setZoom(1);

  const [activeTab, setActiveTab] = React.useState<PropertiesTab>('layout');
  const [componentType, setComponentType] = React.useState<'table' | 'image' | 'chart'>('table');
  const [insertRows, setInsertRows] = React.useState(3);
  const [insertCols, setInsertCols] = React.useState(3);
  const [imageUrlInput, setImageUrlInput] = React.useState('');
  const [imageInsertAlt, setImageInsertAlt] = React.useState('');
  const [imageUploadError, setImageUploadError] = React.useState<string | null>(null);
  const [imageAltDraft, setImageAltDraft] = React.useState('');
  const [imageReplaceOpen, setImageReplaceOpen] = React.useState(false);
  const [imageReplaceUrl, setImageReplaceUrl] = React.useState('');
  const [imageReplaceAlt, setImageReplaceAlt] = React.useState('');
  const [imageReplaceError, setImageReplaceError] = React.useState<string | null>(null);

  const tableActive = Boolean(editor?.isActive('table'));
  const tableAttributes: Partial<PremiumTableAttributes> = tableActive
    ? ((editor?.getAttributes('table') as Partial<PremiumTableAttributes>) ?? {})
    : {};

  const currentBorderWidth = parsePxValue(tableAttributes.borderWidth) ?? parsePxValue(DEFAULT_TABLE_BORDER_WIDTH) ?? 1;
  const currentCellPadding = parsePxValue(tableAttributes.cellPadding) ?? parsePxValue(DEFAULT_TABLE_CELL_PADDING) ?? 12;
  const currentStripe = (tableAttributes.stripe ?? 'none') as 'none' | 'rows';
  const rawTableWidth = tableAttributes.tableWidth ?? 'auto';
  const tableWidthMode: TableWidthMode = rawTableWidth === 'auto' ? 'auto' : rawTableWidth === '100%' ? 'full' : 'custom';
  const [customTableWidth, setCustomTableWidth] = React.useState(() =>
    tableWidthMode === 'custom' ? rawTableWidth : '80%'
  );

  React.useEffect(() => {
    if (tableWidthMode === 'custom') {
      setCustomTableWidth(rawTableWidth);
    }
  }, [rawTableWidth, tableWidthMode]);

  const imageActive = editor?.isActive('image') ?? false;
  const imageAttributes: Partial<EnhancedImageAttributes> = imageActive
    ? ((editor?.getAttributes('image') as Partial<EnhancedImageAttributes>) ?? {})
    : {};
  const imageWidthPercent = Math.round(
    typeof imageAttributes.widthPercent === 'number'
      ? Math.max(10, Math.min(100, imageAttributes.widthPercent))
      : 60,
  );
  const imageAlignment = (imageAttributes.alignment as ImageAlignment) ?? 'inline';
  const imageBorderRadius =
    typeof imageAttributes.borderRadius === 'number' ? Math.max(0, imageAttributes.borderRadius) : 8;
  const imageBorderWidth =
    typeof imageAttributes.borderWidth === 'number' ? Math.max(0, imageAttributes.borderWidth) : 0;
  const imageBorderColor =
    typeof imageAttributes.borderColor === 'string' && imageAttributes.borderColor
      ? imageAttributes.borderColor
      : DEFAULT_IMAGE_BORDER_COLOR;
  const imageShadow = imageAttributes.shadow ?? true;
  const imageRotation = (() => {
    const raw = imageAttributes.rotation;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      const normalized = raw % 360;
      return normalized < 0 ? normalized + 360 : normalized;
    }
    return 0;
  })();
  const imageFlipHorizontal = imageAttributes.flipHorizontal ?? false;
  const imageFlipVertical = imageAttributes.flipVertical ?? false;
  const imageAltValue = typeof imageAttributes.alt === 'string' ? imageAttributes.alt : '';
  const imageSrcValue = typeof imageAttributes.src === 'string' ? imageAttributes.src : '';

  React.useEffect(() => {
    if (imageActive) {
      setImageAltDraft(imageAltValue);
      setComponentType('image');
      setActiveTab('comp');
    } else {
      setImageAltDraft('');
    }
  }, [imageActive, imageAltValue]);

  const handleTabChange = React.useCallback((value: string) => {
    if (!value) {
      return;
    }
    setActiveTab(value as PropertiesTab);
  }, []);

  const canManager = editor?.can();

  const updateImageAttributes = React.useCallback(
    (next: Partial<EnhancedImageAttributes>) => {
      if (!editor || !imageActive) {
        return;
      }
      editor.chain().focus().updateAttributes('image', next).run();
    },
    [editor, imageActive],
  );

  const updateTableAttributes = (update: Partial<PremiumTableAttributes>) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('table', update).run();
  };

  const handleInsertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: Math.max(1, insertRows), cols: Math.max(1, insertCols), withHeaderRow: true })
      .run();
  };

  const handleQuickAction = (action: 'addRow' | 'deleteRow' | 'addColumn' | 'deleteColumn') => {
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (action) {
      case 'addRow':
        chain.addRowAfter().run();
        break;
      case 'deleteRow':
        chain.deleteRow().run();
        break;
      case 'addColumn':
        chain.addColumnAfter().run();
        break;
      case 'deleteColumn':
        chain.deleteColumn().run();
        break;
    }
  };

  const handleEditSelection = (scope: TableSelectionScope) => {
    if (!editor) return;
    applyTableSelection(editor, scope);
  };

  const handleTableWidthChange = (mode: TableWidthMode) => {
    if (mode === 'auto') {
      updateTableAttributes({ tableWidth: 'auto' });
    } else if (mode === 'full') {
      updateTableAttributes({ tableWidth: '100%' });
    } else {
      updateTableAttributes({ tableWidth: normalizeWidthInput(customTableWidth) });
    }
  };

  const handleCustomWidthCommit = (value: string) => {
    const normalized = normalizeWidthInput(value);
    setCustomTableWidth(normalized);
    updateTableAttributes({ tableWidth: normalized });
  };

  const handleImageInsert = ({ src, alt }: { src: string; alt: string }) => {
    if (!editor) {
      return;
    }
    const trimmedAlt = alt.trim();
    const chain = editor.chain().focus().setImage({ src, alt: trimmedAlt.length > 0 ? trimmedAlt : null });
    chain.updateAttributes('image', {
      widthPercent: 60,
      alignment: 'inline',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: DEFAULT_IMAGE_BORDER_COLOR,
      shadow: true,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
    chain.run();
    setComponentType('image');
    setImageUrlInput('');
    setImageInsertAlt('');
    setImageUploadError(null);
  };

  const handleImageAlignmentChange = (value: string) => {
    if (!value || !editor || !imageActive) {
      return;
    }
    updateImageAttributes({ alignment: value as ImageAlignment });
  };

  const handleImageWidthChange = (value: number) => {
    if (!editor || !imageActive) {
      return;
    }
    const next = Math.max(10, Math.min(100, Number.isFinite(value) ? value : imageWidthPercent));
    updateImageAttributes({ widthPercent: next });
  };

  const handleImageBorderRadiusChange = (value: number) => {
    if (!editor || !imageActive) {
      return;
    }
    const next = Math.max(0, Number.isFinite(value) ? value : imageBorderRadius);
    updateImageAttributes({ borderRadius: next });
  };

  const handleImageBorderWidthChange = (value: number) => {
    if (!editor || !imageActive) {
      return;
    }
    const next = Math.max(0, Number.isFinite(value) ? value : imageBorderWidth);
    updateImageAttributes({ borderWidth: next });
  };

  const handleImageBorderColorChange = (color: string) => {
    if (!editor || !imageActive) {
      return;
    }
    updateImageAttributes({ borderColor: color });
  };

  const handleImageShadowToggle = () => {
    if (!editor || !imageActive) {
      return;
    }
    updateImageAttributes({ shadow: !imageShadow });
  };

  const handleImageRotationChange = (value: number) => {
    if (!editor || !imageActive) {
      return;
    }
    const numeric = Number.isFinite(value) ? value : imageRotation;
    let normalized = numeric % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    updateImageAttributes({ rotation: normalized });
  };

  const handleImageFlipHorizontalToggle = () => {
    if (!editor || !imageActive) {
      return;
    }
    updateImageAttributes({ flipHorizontal: !imageFlipHorizontal });
  };

  const handleImageFlipVerticalToggle = () => {
    if (!editor || !imageActive) {
      return;
    }
    updateImageAttributes({ flipVertical: !imageFlipVertical });
  };

  const handleImageAltDraftChange = (value: string) => {
    setImageAltDraft(value);
    if (!editor || !imageActive) {
      return;
    }
    const trimmed = value.trim();
    updateImageAttributes({ alt: trimmed.length > 0 ? trimmed : null });
  };

  const handleImageReplace = () => {
    if (!editor || !imageActive) {
      return;
    }
    setImageReplaceUrl(imageSrcValue ?? '');
    setImageReplaceAlt(imageAltValue);
    setImageReplaceError(null);
    setImageReplaceOpen(true);
  };

  const handleImageReplaceSubmit = ({ src, alt }: { src: string; alt: string }) => {
    if (!editor || !imageActive) {
      return;
    }
    const trimmedAlt = alt.trim();
    updateImageAttributes({ src, alt: trimmedAlt.length > 0 ? trimmedAlt : null });
    setImageAltDraft(trimmedAlt.length > 0 ? trimmedAlt : '');
    handleImageReplaceOpenChange(false);
  };

  const handleImageReplaceOpenChange = (open: boolean) => {
    setImageReplaceOpen(open);
    if (!open) {
      setImageReplaceError(null);
      editor?.view?.focus();
    }
  };

  const handleImageReset = () => {
    if (!editor || !imageActive) {
      return;
    }
    updateImageAttributes({
      widthPercent: 60,
      alignment: 'inline',
      borderRadius: 8,
      borderWidth: 0,
      borderColor: DEFAULT_IMAGE_BORDER_COLOR,
      shadow: true,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
    setImageAltDraft(imageAltValue);
  };

  const handleImageRemove = () => {
    if (!editor || !imageActive) {
      return;
    }
    editor.chain().focus().deleteSelection().run();
  };

  return (
    <div className='flex h-full min-h-0 flex-col gap-4'>
      <Tabs value={activeTab} onValueChange={handleTabChange} className='flex h-full flex-col'>
        <TabsList className='grid w-full grid-cols-4 gap-2 rounded-2xl bg-slate-100/60 p-1 text-sm dark:bg-slate-800/60'>
          <TabsTrigger value='layout' className='gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
            <Ruler className='h-4 w-4' /> Layout
          </TabsTrigger>
          <TabsTrigger value='style' className='gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
            <Palette className='h-4 w-4' /> Style
          </TabsTrigger>
          <TabsTrigger value='type' className='gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
            <TypeIcon className='h-4 w-4' /> Type
          </TabsTrigger>
          <TabsTrigger value='comp' className='gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide'>
            <TableIcon className='h-4 w-4' /> Comp
          </TabsTrigger>
        </TabsList>
        <div className='flex-1 overflow-y-auto pr-1 pt-2 scrollbar-sleek'>
          <TabsContent value='layout' className='space-y-6'>
            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Page size</Label>
              <ToggleGroup
                type='single'
                value={template.page.size}
                onValueChange={(value) =>
                  value &&
                  updateTemplate({
                    page: {
                      ...template.page,
                      size: value as typeof template.page.size,
                    },
                  })
                }
                className='grid grid-cols-2 gap-2'
              >
                <ToggleGroupItem value='Letter'>Letter</ToggleGroupItem>
                <ToggleGroupItem value='A4'>A4</ToggleGroupItem>
              </ToggleGroup>
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Orientation</Label>
              <ToggleGroup
                type='single'
                value={template.page.orientation}
                onValueChange={(value) =>
                  value &&
                  updateTemplate({
                    page: {
                      ...template.page,
                      orientation: value as typeof template.page.orientation,
                    },
                  })
                }
                className='grid grid-cols-2 gap-2'
              >
                <ToggleGroupItem value='portrait'>Portrait</ToggleGroupItem>
                <ToggleGroupItem value='landscape'>Landscape</ToggleGroupItem>
              </ToggleGroup>
            </section>

            <section className='space-y-3'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Margins (pts)</Label>
              <div className='grid grid-cols-2 gap-3'>
                {LAYOUT_MARGIN_FIELDS.map((field) => (
                  <div key={field.key} className='space-y-1'>
                    <span className='text-xs text-slate-500 dark:text-slate-400'>{field.label}</span>
                    <Input
                      type='number'
                      value={Math.round(template.page.margins[field.key])}
                      onChange={(event) => handleMarginChange(field.key, event.target.value)}
                      className='h-9 rounded-xl border-slate-200 text-sm dark:border-slate-700'
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className='space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600 dark:text-slate-300'>Grid guides</span>
                <Button
                  type='button'
                  size='sm'
                  variant={showGrid ? 'default' : 'outline'}
                  className='rounded-full px-4'
                  onClick={toggleGrid}
                >
                  {showGrid ? 'On' : 'Off'}
                </Button>
              </div>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-600 dark:text-slate-300'>Zoom</span>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-slate-700 dark:text-slate-200'>{Math.round(zoom * 100)}%</span>
                    <Button type='button' variant='ghost' size='sm' onClick={handleResetZoom}>
                      Reset
                    </Button>
                  </div>
                </div>
                <Slider value={[zoom * 100]} onValueChange={handleZoomSlider} min={50} max={200} step={10} />
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600 dark:text-slate-300'>Autosave</span>
                <Button
                  type='button'
                  size='sm'
                  variant={autosaveEnabled ? 'default' : 'outline'}
                  className='rounded-full px-4'
                  onClick={() => updatePreferences({ autosave: !autosaveEnabled })}
                >
                  {autosaveEnabled ? 'On' : 'Off'}
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value='style' className='space-y-6'>
            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Theme</Label>
              <ToggleGroup type='single' value={styles.theme} onValueChange={handleThemeChange} className='grid grid-cols-2 gap-2'>
                <ToggleGroupItem value='light'>Light</ToggleGroupItem>
                <ToggleGroupItem value='dark'>Dark</ToggleGroupItem>
              </ToggleGroup>
            </section>

            <section className='space-y-3'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Color palette</Label>
              <div className='flex flex-wrap gap-2'>
                {STYLE_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => applyThemeColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-full border border-slate-200 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-slate-700',
                      styles.textColor.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-brand-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2',
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <span className='sr-only'>Use color {color}</span>
                  </button>
                ))}
                <label className='inline-flex h-8 items-center rounded-full border border-dashed border-slate-300 px-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300'>
                  Custom
                  <Input
                    type='color'
                    value={customThemeColor}
                    onChange={(event) => handleCustomThemeColor(event.target.value)}
                    className='ml-2 h-6 w-6 cursor-pointer border-0 bg-transparent p-0'
                  />
                </label>
              </div>
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Background</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type='button' variant='outline' size='sm' className='w-full justify-between rounded-xl px-3 py-2 text-sm'>
                    <span>{BACKGROUND_OPTIONS.find((option) => option.value === appearance.background)?.label ?? 'White'}</span>
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-48 p-2'>
                  <DropdownMenuRadioGroup value={appearance.background} onValueChange={(value) => handleBackgroundChange(value as PageBackgroundOption)}>
                    {BACKGROUND_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Document style</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type='button' variant='outline' size='sm' className='w-full justify-between rounded-xl px-3 py-2 text-sm'>
                    <span>{DOCUMENT_STYLE_PRESETS[appearance.stylePreset].label}</span>
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-48 p-2'>
                  <DropdownMenuRadioGroup value={appearance.stylePreset} onValueChange={(value) => handleDocumentStyleChange(value as DocumentStylePreset)}>
                    {Object.entries(DOCUMENT_STYLE_PRESETS).map(([key, preset]) => (
                      <DropdownMenuRadioItem key={key} value={key}>
                        {preset.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </section>

            <section className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600 dark:text-slate-300'>Drop shadows</span>
                <Button
                  type='button'
                  size='sm'
                  variant={appearance.dropShadow ? 'default' : 'outline'}
                  className='rounded-full px-4'
                  onClick={handleToggleDropShadow}
                >
                  {appearance.dropShadow ? 'On' : 'Off'}
                </Button>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-600 dark:text-slate-300'>Page borders</span>
                <Button
                  type='button'
                  size='sm'
                  variant={appearance.pageBorder ? 'default' : 'outline'}
                  className='rounded-full px-4'
                  onClick={handleTogglePageBorder}
                >
                  {appearance.pageBorder ? 'On' : 'Off'}
                </Button>
              </div>
            </section>
          </TabsContent>
          <TabsContent value='type' className='space-y-6'>
            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Font family</Label>
              <FontFamilyDropdown
                label={selectionFontPresetLabel}
                value={selectionFontFamily}
                placeholder='System Default'
                onSelectPreset={handleSelectionFontFamilyChange}
                onCustomChange={handleSelectionFontFamilyChange}
                disabled={selectionDisabled}
              />
            </section>

            <section className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                <span>Font size</span>
                <span>{Math.round(selectionFontSize)}pt</span>
              </div>
              <Slider
                value={[selectionFontSize]}
                onValueChange={(value) => handleSelectionFontSizeChange(value[0] ?? selectionFontSize)}
                min={8}
                max={72}
                step={1}
                disabled={selectionDisabled}
              />
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Text format</Label>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant={selectionBoldActive ? 'default' : 'outline'}
                  size='sm'
                  className='h-9 w-9 rounded-xl font-bold'
                  disabled={selectionDisabled}
                  onClick={() => toggleMark('bold')}
                >
                  B
                </Button>
                <Button
                  type='button'
                  variant={selectionItalicActive ? 'default' : 'outline'}
                  size='sm'
                  className='h-9 w-9 rounded-xl italic'
                  disabled={selectionDisabled}
                  onClick={() => toggleMark('italic')}
                >
                  I
                </Button>
                <Button
                  type='button'
                  variant={selectionUnderlineActive ? 'default' : 'outline'}
                  size='sm'
                  className='h-9 w-9 rounded-xl underline'
                  disabled={selectionDisabled}
                  onClick={() => toggleMark('underline')}
                >
                  U
                </Button>
              </div>
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Text alignment</Label>
              <ToggleGroup
                type='single'
                value={editor?.isActive({ textAlign: 'justify' }) ? 'justify' : editor?.isActive({ textAlign: 'right' }) ? 'right' : editor?.isActive({ textAlign: 'center' }) ? 'center' : 'left'}
                onValueChange={(value) => value && handleSelectAlignment(value as ParagraphAlignment)}
                className='grid grid-cols-4 gap-2'
                disabled={selectionDisabled}
              >
                <ToggleGroupItem value='left'>
                  <AlignLeft className='h-4 w-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='center'>
                  <AlignCenter className='h-4 w-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='right'>
                  <AlignRight className='h-4 w-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='justify'>
                  <AlignJustify className='h-4 w-4' />
                </ToggleGroupItem>
              </ToggleGroup>
            </section>

            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Text color</Label>
              <div className='flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                {STYLE_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => handleSelectionColor(color)}
                    disabled={selectionDisabled}
                    className={cn(
                      'h-8 w-8 rounded-full border border-slate-200 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700',
                      selectionColorValue.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-brand-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2',
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <span className='sr-only'>Apply color {color}</span>
                  </button>
                ))}
                <Button type='button' variant='ghost' size='sm' disabled={selectionDisabled || !selectionColorValue} onClick={handleSelectionColorClear}>
                  Clear
                </Button>
              </div>
            </section>

            <section className='grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2'>
              <div className='space-y-2'>
                <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Line spacing</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type='button' variant='outline' size='sm' className='w-full justify-between rounded-xl px-3 py-2 text-sm'>
                      <span>{selectionLineHeight.toFixed(2)}</span>
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-40 p-2'>
                    <DropdownMenuRadioGroup
                      value={selectionLineHeight.toFixed(2)}
                      onValueChange={(value) => handleSelectionLineHeightChange(Number.parseFloat(value))}
                    >
                      {LINE_SPACING_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option.toFixed(2)} disabled={selectionDisabled}>
                          {option.toFixed(2)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='space-y-2'>
                <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Paragraph style</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type='button' variant='outline' size='sm' className='w-full justify-between rounded-xl px-3 py-2 text-sm'>
                      <span>{PARAGRAPH_STYLE_OPTIONS.find((option) => option.value === paragraphStyleValue)?.label ?? 'Paragraph'}</span>
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-44 p-2'>
                    <DropdownMenuRadioGroup value={paragraphStyleValue} onValueChange={handleParagraphStyleChange}>
                      {PARAGRAPH_STYLE_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={option.value} disabled={selectionDisabled}>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>

            <p className='text-xs text-slate-500 dark:text-slate-400'>
              {selectionDisabled
                ? 'Select text in the document to enable formatting controls.'
                : 'Changes apply instantly to the highlighted text.'}
            </p>
          </TabsContent>
          <TabsContent value='comp' className='space-y-6'>
            <section className='space-y-2'>
              <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Component type</Label>
              <div className='grid grid-cols-3 gap-2'>
                <Button
                  type='button'
                  variant={componentType === 'table' ? 'default' : 'outline'}
                  size='sm'
                  className='flex items-center justify-center gap-2 rounded-xl'
                  onClick={() => setComponentType('table')}
                >
                  <TableIcon className='h-4 w-4' /> Table
                </Button>
                <Button
                  type='button'
                  variant={componentType === 'image' ? 'default' : 'outline'}
                  size='sm'
                  className='flex items-center justify-center gap-2 rounded-xl'
                  onClick={() => setComponentType('image')}
                >
                  <ImageIcon className='h-4 w-4' /> Image
                </Button>
                <Button
                  type='button'
                  variant={componentType === 'chart' ? 'default' : 'outline'}
                  size='sm'
                  className='flex items-center justify-center gap-2 rounded-xl'
                  onClick={() => setComponentType('chart')}
                >
                  <BarChart2 className='h-4 w-4' /> Chart
                </Button>
              </div>
            </section>

            {componentType === 'table' ? (
              <>
                <section className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Table structure</span>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <span className='text-xs text-slate-500 dark:text-slate-400'>Rows</span>
                      <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900'>
                        <Button type='button' size='icon' variant='ghost' className='h-7 w-7' onClick={() => setInsertRows((value) => Math.max(1, value - 1))}>
                          <Minus className='h-4 w-4' />
                        </Button>
                        <span className='min-w-[2ch] text-center text-sm font-semibold'>{insertRows}</span>
                        <Button type='button' size='icon' variant='ghost' className='h-7 w-7' onClick={() => setInsertRows((value) => Math.min(20, value + 1))}>
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <span className='text-xs text-slate-500 dark:text-slate-400'>Columns</span>
                      <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900'>
                        <Button type='button' size='icon' variant='ghost' className='h-7 w-7' onClick={() => setInsertCols((value) => Math.max(1, value - 1))}>
                          <Minus className='h-4 w-4' />
                        </Button>
                        <span className='min-w-[2ch] text-center text-sm font-semibold'>{insertCols}</span>
                        <Button type='button' size='icon' variant='ghost' className='h-7 w-7' onClick={() => setInsertCols((value) => Math.min(20, value + 1))}>
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button type='button' className='w-full rounded-xl' onClick={handleInsertTable}>
                    Insert Table
                  </Button>
                </section>

                <section className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Edit selection</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type='button' variant='outline' size='sm' className='w-full justify-between rounded-xl px-3 py-2 text-sm'>
                        Whole table
                        <ChevronDown className='h-4 w-4 opacity-50' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-44 p-2'>
                      <DropdownMenuItem onSelect={() => handleEditSelection('table')} disabled={!tableActive}>
                        Whole Table
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleEditSelection('row')} disabled={!tableActive}>
                        Row
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleEditSelection('column')} disabled={!tableActive}>
                        Column
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleEditSelection('cell')} disabled={!tableActive}>
                        Cell
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </section>

                <Dialog open={imageReplaceOpen} onOpenChange={handleImageReplaceOpenChange}>
                  <DialogContent className='max-w-lg'>
                    <DialogHeader>
                      <DialogTitle>Update image</DialogTitle>
                      <DialogDescription>
                        Swap the image source or alt text without leaving the editor canvas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6'>
                      <ImageSourceForm
                        src={imageReplaceUrl}
                        alt={imageReplaceAlt}
                        error={imageReplaceError}
                        onSrcChange={setImageReplaceUrl}
                        onAltChange={setImageReplaceAlt}
                        onErrorChange={setImageReplaceError}
                        onSubmit={handleImageReplaceSubmit}
                        submitLabel='Update image'
                        secondaryActions={
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='rounded-xl'
                            onClick={() => handleImageReplaceOpenChange(false)}
                          >
                            Cancel
                          </Button>
                        }
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <section className='space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Table styling</span>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                      <span>Border width</span>
                      <span>{Math.round(currentBorderWidth)}px</span>
                    </div>
                    <Slider
                      value={[currentBorderWidth]}
                      onValueChange={(value) => updateTableAttributes({ borderWidth: `${Math.max(0, value[0] ?? currentBorderWidth)}px` })}
                      min={0}
                      max={6}
                      step={1}
                      disabled={!tableActive}
                    />
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                      <span>Cell padding</span>
                      <span>{Math.round(currentCellPadding)}px</span>
                    </div>
                    <Slider
                      value={[currentCellPadding]}
                      onValueChange={(value) => updateTableAttributes({ cellPadding: `${Math.max(4, value[0] ?? currentCellPadding)}px` })}
                      min={4}
                      max={32}
                      step={1}
                      disabled={!tableActive}
                    />
                  </div>
                  <div className='space-y-2'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Table width</span>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant={tableWidthMode === 'auto' ? 'default' : 'outline'}
                        className='rounded-xl'
                        disabled={!tableActive}
                        onClick={() => handleTableWidthChange('auto')}
                      >
                        Auto
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={tableWidthMode === 'full' ? 'default' : 'outline'}
                        className='rounded-xl'
                        disabled={!tableActive}
                        onClick={() => handleTableWidthChange('full')}
                      >
                        100%
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={tableWidthMode === 'custom' ? 'default' : 'outline'}
                        className='rounded-xl'
                        disabled={!tableActive}
                        onClick={() => handleTableWidthChange('custom')}
                      >
                        Custom
                      </Button>
                    </div>
                    <Input
                      value={customTableWidth}
                      onChange={(event) => setCustomTableWidth(event.target.value)}
                      onBlur={(event) => handleCustomWidthCommit(event.target.value)}
                      disabled={!tableActive}
                      placeholder='e.g. 80% or 600px'
                      className='h-9 rounded-xl border-slate-200 text-sm dark:border-slate-700'
                    />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      className='rounded-xl'
                      disabled={!tableActive}
                      onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
                    >
                      Header row styling
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant={currentStripe === 'rows' ? 'default' : 'outline'}
                      className='rounded-xl'
                      disabled={!tableActive}
                      onClick={() => updateTableAttributes({ stripe: currentStripe === 'rows' ? 'none' : 'rows' })}
                    >
                      Alternate row colors
                    </Button>
                  </div>
                </section>

                <section className='space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Quick actions</span>
                  <div className='grid grid-cols-2 gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      className='rounded-xl'
                      disabled={!tableActive || !canManager?.addRowAfter?.()}
                      onClick={() => handleQuickAction('addRow')}
                    >
                      Add Row
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      className='rounded-xl'
                      disabled={!tableActive || !canManager?.addColumnAfter?.()}
                      onClick={() => handleQuickAction('addColumn')}
                    >
                      Add Column
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      className='rounded-xl'
                      disabled={!tableActive || !canManager?.deleteRow?.()}
                      onClick={() => handleQuickAction('deleteRow')}
                    >
                      Delete Row
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      className='rounded-xl'
                      disabled={!tableActive || !canManager?.deleteColumn?.()}
                      onClick={() => handleQuickAction('deleteColumn')}
                    >
                      Delete Column
                    </Button>
                  </div>
                </section>
              </>
            ) : componentType === 'image' ? (
              <>
                <section className='space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Insert image</span>
                  <ImageSourceForm
                    src={imageUrlInput}
                    alt={imageInsertAlt}
                    error={imageUploadError}
                    onSrcChange={(value) => {
                      setImageUrlInput(value);
                    }}
                    onAltChange={setImageInsertAlt}
                    onErrorChange={setImageUploadError}
                    onSubmit={handleImageInsert}
                    submitLabel='Insert image'
                    secondaryActions={
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='rounded-xl'
                        onClick={() => {
                          setImageUrlInput('');
                          setImageInsertAlt('');
                          setImageUploadError(null);
                        }}
                      >
                        Clear
                      </Button>
                    }
                  />
                </section>

                <section className='space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Selected image</span>
                    {imageActive ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='gap-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300'
                        onClick={handleImageReplace}
                      >
                        <RefreshCcw className='h-3.5 w-3.5' /> Replace
                      </Button>
                    ) : null}
                  </div>

                  {imageActive ? (
                    <>
                      <div className='space-y-2'>
                        <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Alt text</Label>
                        <Input
                          value={imageAltDraft}
                          onChange={(event) => handleImageAltDraftChange(event.target.value)}
                          placeholder='Describe the image'
                          className='h-9 rounded-xl border-slate-200 text-sm dark:border-slate-700'
                        />
                      </div>

                      <div className='space-y-2'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Alignment</span>
                        <ToggleGroup
                          type='single'
                          value={imageAlignment}
                          onValueChange={handleImageAlignmentChange}
                          className='flex flex-wrap gap-2'
                        >
                          {IMAGE_ALIGNMENT_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <ToggleGroupItem
                                key={option.value}
                                value={option.value}
                                className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition data-[state=on]:border-brand-500 data-[state=on]:bg-brand-500/10 data-[state=on]:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:data-[state=on]:border-brand-400 dark:data-[state=on]:text-brand-100'
                              >
                                <Icon className='h-4 w-4' /> {option.label}
                              </ToggleGroupItem>
                            );
                          })}
                        </ToggleGroup>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                          <span>Width</span>
                          <span>{imageWidthPercent}%</span>
                        </div>
                        <Slider
                          value={[imageWidthPercent]}
                          onValueChange={(value) => handleImageWidthChange(value[0] ?? imageWidthPercent)}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                          <span>Rotation</span>
                          <span>{Math.round(imageRotation)}°</span>
                        </div>
                        <Slider
                          value={[imageRotation]}
                          onValueChange={(value) => handleImageRotationChange(value[0] ?? imageRotation)}
                          min={0}
                          max={360}
                          step={1}
                        />
                      </div>

                      <div className='space-y-2'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Flip</span>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            type='button'
                            size='sm'
                            variant={imageFlipHorizontal ? 'default' : 'outline'}
                            className='gap-2 rounded-xl'
                            onClick={handleImageFlipHorizontalToggle}
                          >
                            <FlipHorizontal className='h-4 w-4' /> {imageFlipHorizontal ? 'Unflip horizontal' : 'Flip horizontal'}
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant={imageFlipVertical ? 'default' : 'outline'}
                            className='gap-2 rounded-xl'
                            onClick={handleImageFlipVerticalToggle}
                          >
                            <FlipVertical className='h-4 w-4' /> {imageFlipVertical ? 'Unflip vertical' : 'Flip vertical'}
                          </Button>
                        </div>
                      </div>

                      <div className='grid gap-3 sm:grid-cols-2'>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                            <span>Corner radius</span>
                            <span>{Math.round(imageBorderRadius)}px</span>
                          </div>
                          <Slider
                            value={[imageBorderRadius]}
                            onValueChange={(value) => handleImageBorderRadiusChange(value[0] ?? imageBorderRadius)}
                            min={0}
                            max={48}
                            step={2}
                          />
                        </div>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-sm text-slate-600 dark:text-slate-300'>
                            <span>Border width</span>
                            <span>{Math.round(imageBorderWidth)}px</span>
                          </div>
                          <Slider
                            value={[imageBorderWidth]}
                            onValueChange={(value) => handleImageBorderWidthChange(value[0] ?? imageBorderWidth)}
                            min={0}
                            max={12}
                            step={1}
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Border color</span>
                        <div className='flex flex-wrap items-center gap-2'>
                          {IMAGE_BORDER_COLORS.map((color) => (
                            <button
                              key={color}
                              type='button'
                              onClick={() => handleImageBorderColorChange(color)}
                              className={cn(
                                'h-8 w-8 rounded-full border border-slate-200 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-slate-700',
                                imageBorderColor.toLowerCase() === color.toLowerCase()
                                  ? 'ring-2 ring-brand-500 ring-offset-2'
                                  : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2',
                              )}
                              style={{ backgroundColor: color }}
                            >
                              <span className='sr-only'>Apply border color {color}</span>
                            </button>
                          ))}
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='rounded-xl'
                            onClick={() => handleImageBorderWidthChange(0)}
                          >
                            Remove border
                          </Button>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant={imageBorderWidth > 0 ? 'default' : 'outline'}
                          className='gap-2 rounded-xl'
                          onClick={() => handleImageBorderWidthChange(imageBorderWidth > 0 ? 0 : 2)}
                        >
                          <Square className='h-4 w-4' /> {imageBorderWidth > 0 ? 'Border on' : 'Add border'}
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant={imageShadow ? 'default' : 'outline'}
                          className='gap-2 rounded-xl'
                          onClick={handleImageShadowToggle}
                        >
                          <Sparkles className='h-4 w-4' /> {imageShadow ? 'Shadow on' : 'Shadow off'}
                        </Button>
                      </div>

                      <div className='flex items-center justify-between'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='rounded-xl text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300'
                          onClick={handleImageReset}
                        >
                          Reset formatting
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='flex items-center gap-1 rounded-xl border-red-200 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10'
                          onClick={handleImageRemove}
                        >
                          <Trash2 className='h-3.5 w-3.5' /> Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400'>
                      Select an image in the document to unlock formatting options.
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'>
                Component tools for charts are coming soon. Select Table or Image to access inline editing controls.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
