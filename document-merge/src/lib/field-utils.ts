import type { DatasetField } from './types';

/**
 * Convert a machine field type into a human friendly label.
 */
export function formatFieldType(type: string): string {
  const normalized = type.replace(/[-_\s]+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  return normalized
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

/**
 * Filter a list of dataset fields using a fuzzy query that matches on label,
 * key, or normalized type label.
 */
export function filterFieldsByQuery(fields: DatasetField[], query: string): DatasetField[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return fields;
  }

  return fields.filter((field) => {
    const label = field.label.toLowerCase();
    const key = field.key.toLowerCase();
    const typeLabel = formatFieldType(field.type).toLowerCase();
    return (
      label.includes(trimmed) ||
      key.includes(trimmed) ||
      (typeLabel.length > 0 && typeLabel.includes(trimmed))
    );
  });
}
