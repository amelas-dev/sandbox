import { describe, expect, it } from 'vitest';
import { assertTemplateDoc, TemplateValidationError } from '../src/lib/guards';

const validTemplate = {
  content: { type: 'doc', content: [] },
  page: {
    size: 'Letter',
    orientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  styles: {
    fontFamily: 'Inter',
    baseFontSize: 14,
    theme: 'light',
  },
};

describe('assertTemplateDoc', () => {
  it('returns a template when the structure is valid', () => {
    expect(assertTemplateDoc(validTemplate)).toEqual(validTemplate);
  });

  it('throws for malformed templates', () => {
    expect(() => assertTemplateDoc({})).toThrow(TemplateValidationError);
  });
});
