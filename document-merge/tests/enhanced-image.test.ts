import { describe, expect, test } from 'vitest';
import { EnhancedImage } from '@/editor/extensions/enhanced-image';

describe('EnhancedImage extension', () => {
  test('applies inline styles derived from stored attributes', () => {
    const render = EnhancedImage.config.renderHTML!;
    const [, attributes] = render.call(EnhancedImage, {
      HTMLAttributes: {
        src: 'https://example.com/image.png',
        widthPercent: 65,
        'data-width-percent': 65,
        alignment: 'left',
        'data-align': 'left',
        borderRadius: 10,
        'data-border-radius': 10,
        borderWidth: 2,
        'data-border-width': 2,
        borderColor: '#336699',
        'data-border-color': '#336699',
        shadow: false,
        'data-shadow': 'false',
        rotation: 45,
        'data-rotation': 45,
        flipHorizontal: true,
        'data-flip-horizontal': 'true',
        flipVertical: false,
        'data-flip-vertical': 'false',
      },
    } as Parameters<typeof render>[0]);

    expect(attributes.class).toContain('dm-image-align-left');
    expect(attributes.style).toContain('width: 65%');
    expect(attributes.style).toContain('border-radius: 10px');
    expect(attributes.style).toContain('border-width: 2px');
    expect(attributes.style).toContain('border-style: solid');
    expect(attributes.style).toContain('box-shadow: none');
    expect(attributes.style).toContain('transform: rotate(45deg) scaleX(-1)');
  });
});

