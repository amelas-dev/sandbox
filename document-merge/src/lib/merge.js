const MERGE_TAG_REGEX = /{{\s*([\w.]+)\s*}}/g;
function getNestedValue(record, path) {
    return path.split('.').reduce((value, segment) => {
        if (value && typeof value === 'object' && segment in value) {
            return value[segment];
        }
        return undefined;
    }, record);
}
export function substituteMergeTags(text, record) {
    return text.replace(MERGE_TAG_REGEX, (_match, key) => {
        const value = getNestedValue(record, key.trim());
        if (value === undefined || value === null) {
            return '';
        }
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        return String(value);
    });
}
export function renderFilename(pattern, record, fallback = 'document') {
    const base = substituteMergeTags(pattern, record).trim() || fallback;
    return base
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
}
export function filterRows(dataset, options) {
    if (options.range === 'selection' && options.selection?.length) {
        return options.selection;
    }
    if (options.range === 'filtered' && options.filter) {
        const { field, op, value } = options.filter;
        return dataset.rows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => {
            const fieldValue = row[field];
            switch (op) {
                case 'eq':
                    return fieldValue === value;
                case 'neq':
                    return fieldValue !== value;
                case 'gt':
                    return Number(fieldValue) > Number(value);
                case 'lt':
                    return Number(fieldValue) < Number(value);
                case 'contains':
                    return String(fieldValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
                default:
                    return false;
            }
        })
            .map(({ index }) => index);
    }
    return dataset.rows.map((_, index) => index);
}
export async function expandTemplateToHtml(template, record, dataset) {
    const [{ generateHTML }, StarterKitModule, TextAlignModule, UnderlineModule, LinkModule, ImageModule, TableModule, TableRowModule, TableHeaderModule, TableCellModule, ColorModule, TextStyleModule, HighlightModule, MergeTagModule] = await Promise.all([
        import('@tiptap/react'),
        import('@tiptap/starter-kit'),
        import('@tiptap/extension-text-align'),
        import('@tiptap/extension-underline'),
        import('@tiptap/extension-link'),
        import('@tiptap/extension-image'),
        import('@tiptap/extension-table'),
        import('@tiptap/extension-table-row'),
        import('@tiptap/extension-table-header'),
        import('@tiptap/extension-table-cell'),
        import('@tiptap/extension-color'),
        import('@tiptap/extension-text-style'),
        import('@tiptap/extension-highlight'),
        import('../editor/merge-tag-node'),
    ]);
    const html = generateHTML(template.content, [
        StarterKitModule.default.configure({ history: false }),
        TextAlignModule.default.configure({ types: ['heading', 'paragraph'] }),
        UnderlineModule.default,
        LinkModule.default.configure({ openOnClick: false }),
        ImageModule.default,
        TableModule.default.configure({ resizable: true }),
        TableRowModule.default,
        TableHeaderModule.default,
        TableCellModule.default,
        ColorModule.default,
        TextStyleModule.default,
        HighlightModule.default.configure({ multicolor: true }),
        MergeTagModule.MergeTag.configure({
            sampleProvider: (fieldKey) => {
                const value = record[fieldKey];
                if (value === undefined || value === null) {
                    return '';
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return String(value);
            },
            isFieldValid: (fieldKey) => dataset.fields.some((field) => field.key === fieldKey),
        }),
    ]);
    return substituteMergeTags(html, record);
}
export async function buildGenerationArtifacts(dataset, template, options) {
    const indexes = filterRows(dataset, options);
    const artifacts = [];
    for (const index of indexes) {
        const row = dataset.rows[index];
        const filename = renderFilename(options.filenamePattern, row, `document_${index + 1}`);
        const html = await expandTemplateToHtml(template, row, dataset);
        artifacts.push({ filename, html });
    }
    return artifacts;
}
