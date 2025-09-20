import type { TemplateDoc } from '@/lib/types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMargins(value: unknown): value is TemplateDoc['page']['margins'] {
  return (
    isObject(value) &&
    isFiniteNumber(value.top) &&
    isFiniteNumber(value.right) &&
    isFiniteNumber(value.bottom) &&
    isFiniteNumber(value.left)
  );
}

function isStyles(value: unknown): value is TemplateDoc['styles'] {
  return (
    isObject(value) &&
    typeof value.fontFamily === 'string' &&
    isFiniteNumber(value.baseFontSize) &&
    (value.theme === 'light' || value.theme === 'dark')
  );
}

function isPage(value: unknown): value is TemplateDoc['page'] {
  return (
    isObject(value) &&
    (value.size === 'Letter' || value.size === 'A4') &&
    (value.orientation === 'portrait' || value.orientation === 'landscape') &&
    isMargins(value.margins)
  );
}

export function isTemplateDoc(value: unknown): value is TemplateDoc {
  return isObject(value) && isObject(value.content) && isPage(value.page) && isStyles(value.styles);
}

export class TemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}

export function assertTemplateDoc(value: unknown): TemplateDoc {
  if (!isTemplateDoc(value)) {
    throw new TemplateValidationError('Imported template is malformed.');
  }
  return value;
}

export function createNullPrototypeRecord<T extends Record<string, unknown>>(source?: T): T {
  const target = Object.create(null) as T;
  if (!source) {
    return target;
  }
  return Object.assign(target, source);
}
