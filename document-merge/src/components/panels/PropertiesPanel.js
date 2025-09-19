import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const handleMarginChange = (side, value) => {
        updateTemplate({
            page: {
                ...template.page,
                margins: { ...template.page.margins, [side]: value },
            },
        });
    };
    return (_jsx("div", { className: "flex h-full min-h-0 flex-col gap-4", children: _jsxs(Tabs, { defaultValue: "layout", className: "flex h-full flex-col", children: [_jsxs(TabsList, { className: "w-full justify-start", children: [_jsxs(TabsTrigger, { value: "layout", className: "gap-2", children: [_jsx(Ruler, { className: "h-4 w-4" }), " Layout"] }), _jsxs(TabsTrigger, { value: "style", className: "gap-2", children: [_jsx(Palette, { className: "h-4 w-4" }), " Style"] }), _jsxs(TabsTrigger, { value: "document", className: "gap-2", children: [_jsx(Type, { className: "h-4 w-4" }), " Typography"] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto pt-1", children: [_jsxs(TabsContent, { value: "layout", className: "space-y-4 pr-1", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Page size" }), _jsxs(ToggleGroup, { type: "single", value: template.page.size, onValueChange: (value) => value &&
                                                updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        size: value,
                                                    },
                                                }), className: "mt-2", children: [_jsx(ToggleGroupItem, { value: "Letter", children: "Letter" }), _jsx(ToggleGroupItem, { value: "A4", children: "A4" })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Orientation" }), _jsxs(ToggleGroup, { type: "single", value: template.page.orientation, onValueChange: (value) => value &&
                                                updateTemplate({
                                                    page: {
                                                        ...template.page,
                                                        orientation: value,
                                                    },
                                                }), className: "mt-2", children: [_jsx(ToggleGroupItem, { value: "portrait", children: "Portrait" }), _jsx(ToggleGroupItem, { value: "landscape", children: "Landscape" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Margins (pts)" }), ['top', 'right', 'bottom', 'left'].map((side) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [_jsx("span", { className: "capitalize", children: side }), _jsx("span", { children: Math.round(template.page.margins[side]) })] }), _jsx(Slider, { value: [template.page.margins[side]], onValueChange: (value) => handleMarginChange(side, value[0] ?? template.page.margins[side]), min: 24, max: 144, step: 4 })] }, side)))] }), _jsxs("div", { className: "flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800", children: [_jsx("span", { children: "Grid guides" }), _jsx(Button, { variant: showGrid ? 'default' : 'outline', size: "sm", onClick: toggleGrid, children: showGrid ? 'On' : 'Off' })] }), _jsxs("div", { className: "space-y-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Zoom" }), _jsxs("span", { children: [Math.round(zoom * 100), "%"] })] }), _jsx(Slider, { value: [zoom * 100], onValueChange: (value) => setZoom((value[0] ?? zoom * 100) / 100), min: 50, max: 200, step: 10 })] })] }), _jsxs(TabsContent, { value: "style", className: "space-y-4 pr-1", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fontFamily", children: "Font family" }), _jsx(Input, { id: "fontFamily", value: template.styles.fontFamily, onChange: (event) => updateTemplate({ styles: { fontFamily: event.target.value } }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Theme" }), _jsxs(ToggleGroup, { type: "single", value: template.styles.theme, onValueChange: (value) => value && updateTemplate({ styles: { theme: value } }), children: [_jsx(ToggleGroupItem, { value: "light", children: "Light" }), _jsx(ToggleGroupItem, { value: "dark", children: "Dark" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Base font size" }), _jsx(Slider, { value: [template.styles.baseFontSize], onValueChange: (value) => updateTemplate({ styles: { baseFontSize: value[0] ?? template.styles.baseFontSize } }), min: 10, max: 24 }), _jsxs("div", { className: "text-xs text-slate-500", children: [template.styles.baseFontSize, "px"] })] })] }), _jsxs(TabsContent, { value: "document", className: "space-y-4 pr-1", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Heading weight" }), _jsxs(ToggleGroup, { type: "single", className: "mt-1", value: "700", children: [_jsx(ToggleGroupItem, { value: "600", children: "Semi-bold" }), _jsx(ToggleGroupItem, { value: "700", children: "Bold" }), _jsx(ToggleGroupItem, { value: "800", children: "Extra-bold" })] }), _jsx("p", { className: "text-xs text-slate-500", children: "Heading styles are applied via the toolbar. Customize defaults here to keep branding consistent." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Paragraph spacing" }), _jsx(Slider, { value: [14], min: 8, max: 32, disabled: true }), _jsx("p", { className: "text-xs text-slate-400", children: "Advanced spacing presets coming soon." })] })] })] })] }) }));
}
