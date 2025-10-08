import * as React from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ImageSourceValue {
  file: File | null;
  src: string;
}

export interface ImageSourceSubmitValue extends ImageSourceValue {
  alt: string;
}

interface ImageSourceFormProps {
  source: ImageSourceValue | null;
  alt: string;
  error?: string | null;
  description?: string;
  onSourceChange: (value: ImageSourceValue | null) => void;
  onAltChange: (value: string) => void;
  onErrorChange?: (value: string | null) => void;
  onSubmit: (value: ImageSourceSubmitValue) => void;
  submitLabel: string;
  secondaryActions?: React.ReactNode;
  initialFocus?: 'file' | 'alt';
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

export function ImageSourceForm({
  source,
  alt,
  error,
  description = 'Upload an image up to 5 MB. Images insert at 60% width by default.',
  onSourceChange,
  onAltChange,
  onErrorChange,
  onSubmit,
  submitLabel,
  secondaryActions,
  initialFocus = 'file',
}: ImageSourceFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const altInputRef = React.useRef<HTMLInputElement | null>(null);
  const [internalError, setInternalError] = React.useState<string | null>(null);

  const setError = React.useCallback(
    (value: string | null) => {
      setInternalError(value);
      onErrorChange?.(value);
    },
    [onErrorChange],
  );

  React.useEffect(() => {
    if (initialFocus === 'alt' && altInputRef.current) {
      altInputRef.current.focus();
      return;
    }
    if (initialFocus === 'file' && fileButtonRef.current) {
      fileButtonRef.current.focus();
    }
  }, [initialFocus]);

  const mergedError = error ?? internalError;
  const previewSrc = source?.src ?? '';
  const fileName = source?.file?.name;
  const isSubmitDisabled = previewSrc.trim().length === 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSrc = previewSrc.trim();
    if (!trimmedSrc) {
      setError('Choose an image to continue.');
      return;
    }
    setError(null);
    onSubmit({ src: trimmedSrc, alt: alt.trim(), file: source?.file ?? null });
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setError('File is larger than 5 MB. Choose a smaller image.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      const nextSrc = typeof reader.result === 'string' ? reader.result : '';
      onSourceChange(nextSrc ? { file, src: nextSrc } : null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      <div className='space-y-2'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
          Upload image
        </Label>
        <div className='flex items-center gap-3'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleUpload}
            className='hidden'
          />
          <Button
            ref={fileButtonRef}
            type='button'
            size='sm'
            variant='outline'
            className='gap-2 rounded-xl'
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className='h-4 w-4' /> Choose image
          </Button>
          {previewSrc ? (
            <div className='flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700'>
              <span className='inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800'>
                {previewSrc.startsWith('data:') || previewSrc.startsWith('http') || previewSrc.startsWith('blob:') ? (
                  <img src={previewSrc} alt='' className='h-full w-full object-cover' />
                ) : (
                  <ImageIcon className='h-4 w-4 text-slate-500' />
                )}
              </span>
              <span className='truncate font-medium text-slate-600 dark:text-slate-200'>
                {fileName ?? 'Current image'}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-7 w-7 shrink-0 rounded-full text-slate-500 hover:text-red-500'
                onClick={() => {
                  onSourceChange(null);
                  setError(null);
                }}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className='space-y-2'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
          Alt text
        </Label>
        <Input
          ref={altInputRef}
          value={alt}
          onChange={(event) => {
            setError(null);
            onAltChange(event.target.value);
          }}
          placeholder='Describe the image for accessibility'
          className='h-9 rounded-xl border-slate-200 text-sm dark:border-slate-700'
        />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button type='submit' size='sm' className='rounded-xl' disabled={isSubmitDisabled}>
          {submitLabel}
        </Button>
        {secondaryActions}
      </div>
      {mergedError ? (
        <p className='text-xs font-medium text-red-500 dark:text-red-400'>{mergedError}</p>
      ) : null}
      {description ? (
        <p className='text-xs text-slate-500 dark:text-slate-400'>{description}</p>
      ) : null}
    </form>
  );
}
