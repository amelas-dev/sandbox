import * as React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageSourceFormProps {
  src: string;
  alt: string;
  error?: string | null;
  description?: string;
  onSrcChange: (value: string) => void;
  onAltChange: (value: string) => void;
  onErrorChange?: (value: string | null) => void;
  onSubmit: (value: { src: string; alt: string }) => void;
  submitLabel: string;
  secondaryActions?: React.ReactNode;
  initialFocus?: 'src' | 'alt';
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

export function ImageSourceForm({
  src,
  alt,
  error,
  description = 'Paste a web URL or upload a file up to 5 MB. Images insert at 60% width by default.',
  onSrcChange,
  onAltChange,
  onErrorChange,
  onSubmit,
  submitLabel,
  secondaryActions,
  initialFocus = 'src',
}: ImageSourceFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const urlInputRef = React.useRef<HTMLInputElement | null>(null);
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
    if (initialFocus === 'src' && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [initialFocus]);

  const mergedError = error ?? internalError;
  const isSubmitDisabled = src.trim().length === 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSrc = src.trim();
    if (!trimmedSrc) {
      setError('Enter an image URL or upload a file.');
      return;
    }
    setError(null);
    onSubmit({ src: trimmedSrc, alt: alt.trim() });
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
      onSrcChange(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      <div className='space-y-2'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
          Image source
        </Label>
        <Input
          ref={urlInputRef}
          value={src}
          onChange={(event) => {
            setError(null);
            onSrcChange(event.target.value);
          }}
          placeholder='https://example.com/visual.png or data URI'
          className='h-9 rounded-xl border-slate-200 text-sm dark:border-slate-700'
        />
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
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleUpload}
          className='hidden'
        />
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='gap-2 rounded-xl'
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className='h-4 w-4' /> Upload
        </Button>
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
