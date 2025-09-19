const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const CURRENCY_REGEX = /^\$?\s?-?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?$/;
/**
 * Normalize a header into a unique key safe for use as a merge field.
 */
export function normalizeHeader(label, taken) {
    const base = label
        .trim()
        .replace(/[^\p{L}0-9]+/gu, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_')
        .toLowerCase() || 'field';
    let key = base;
    let counter = 1;
    while (taken.has(key)) {
        key = `${base}_${counter++}`;
    }
    taken.add(key);
    return key;
}
/**
 * Determine the best field type from a sample value.
 */
export function detectFieldType(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return 'number';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return 'string';
        if (ISO_DATE_REGEX.test(trimmed) || !Number.isNaN(Date.parse(trimmed))) {
            return 'date';
        }
        if (CURRENCY_REGEX.test(trimmed)) {
            return 'currency';
        }
        if (!Number.isNaN(Number(trimmed.replace(/[$,]/g, '')))) {
            return 'number';
        }
        if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
            return 'boolean';
        }
    }
    return 'string';
}
/**
 * Inspect column data to infer its type.
 */
export function inferFieldType(samples) {
    const counts = {
        string: 0,
        number: 0,
        date: 0,
        boolean: 0,
        currency: 0,
    };
    samples.forEach((sample) => {
        const type = detectFieldType(sample);
        counts[type] += 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'string';
}
export function normalizeHeaders(headers) {
    const taken = new Set();
    const fields = [];
    const report = [];
    headers.forEach((label) => {
        const key = normalizeHeader(label, taken);
        fields.push({ key, label: label.trim() || key, type: 'string' });
        report.push({ original: label, normalized: key });
    });
    return { fields, headerReport: report };
}
/**
 * Build a dataset object by inferring field types and preserving meta.
 */
export function buildDataset(records, headers, meta) {
    const columnSamples = {};
    records.forEach((record) => {
        headers.fields.forEach((field) => {
            const value = record[field.key];
            if (!columnSamples[field.key]) {
                columnSamples[field.key] = [];
            }
            if (value !== undefined && value !== null && columnSamples[field.key].length < 20) {
                columnSamples[field.key].push(value);
            }
        });
    });
    const fields = headers.fields.map((field) => ({
        ...field,
        type: inferFieldType(columnSamples[field.key] ?? []),
    }));
    return {
        fields,
        rows: records,
        sourceMeta: meta ?? { importedAt: new Date().toISOString() },
    };
}
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current);
    return result.map((value) => value.replace(/\r?\n/g, '\n').trim());
}
function parseCsvText(text) {
    const rows = [];
    let buffer = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        buffer += char;
        if (char === '"') {
            const prev = text[i - 1];
            if (inQuotes && text[i + 1] === '"') {
                buffer += '"';
                i += 1;
            }
            else if (prev !== '\\') {
                inQuotes = !inQuotes;
            }
        }
        if ((char === '\n' || i === text.length - 1) && !inQuotes) {
            const line = buffer.trimEnd();
            if (line) {
                rows.push(parseCsvLine(line));
            }
            buffer = '';
        }
    }
    return rows.filter((row) => row.some((cell) => cell.length > 0));
}
export function parseCsvString(content, meta) {
    const rows = parseCsvText(content);
    if (!rows.length) {
        throw new Error('No rows found in CSV.');
    }
    const [headerRow, ...dataRows] = rows;
    const headerInfo = normalizeHeaders(headerRow);
    const issues = [];
    const records = dataRows.map((cells, rowIndex) => {
        const record = {};
        headerInfo.fields.forEach((field, fieldIndex) => {
            record[field.key] = cells[fieldIndex] ?? '';
        });
        if (cells.length > headerInfo.fields.length) {
            issues.push({
                row: rowIndex + 2,
                field: headerInfo.fields[headerInfo.fields.length - 1]?.label ?? 'unknown',
                message: 'Extra columns detected in row.',
            });
        }
        return record;
    });
    const dataset = buildDataset(records, headerInfo, meta);
    return { dataset, issues, headerReport: headerInfo.headerReport };
}
export async function parseCsvFile(file) {
    const text = await file.text();
    return parseCsvString(text, {
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
    });
}
export async function parseJsonText(content, meta) {
    const value = JSON.parse(content);
    if (!Array.isArray(value)) {
        throw new Error('JSON must be an array of records.');
    }
    if (!value.length) {
        throw new Error('JSON array is empty.');
    }
    const headers = Object.keys(value[0]);
    const headerInfo = normalizeHeaders(headers);
    const records = value.map((entry) => {
        const record = {};
        headerInfo.fields.forEach((field) => {
            record[field.key] = entry[field.label] ?? entry[field.key] ?? '';
        });
        return record;
    });
    const dataset = buildDataset(records, headerInfo, meta);
    return { dataset, issues: [], headerReport: headerInfo.headerReport };
}
export async function parseJsonFile(file) {
    const text = await file.text();
    return parseJsonText(text, {
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
    });
}
export async function parseXlsxFile(file) {
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
    });
    const meta = { name: file.name, size: file.size, importedAt: new Date().toISOString() };
    return parseJsonText(JSON.stringify(json), meta);
}
export function datasetPreview(dataset, limit = 100) {
    return dataset.rows.slice(0, limit);
}
export function getSampleValue(dataset, fieldKey, index) {
    if (!dataset)
        return '';
    const row = dataset.rows[index] ?? dataset.rows[0];
    if (!row)
        return '';
    const value = row[fieldKey];
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'number')
        return value.toLocaleString();
    if (value instanceof Date)
        return value.toISOString();
    return String(value);
}
