'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

interface ImageUploadZoneProps {
  onInsert: (markdown: string) => void;
  className?: string;
}

export function ImageUploadZone({ onInsert, className }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setUploadError('Solo se permiten archivos de imagen');
        return;
      }

      setUploading(true);
      setUploadError('');

      try {
        for (const file of imageFiles) {
          const { url } = await api.uploadImage(file);
          const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          onInsert(`![${alt}](${url})`);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Error al subir imagen');
      } finally {
        setUploading(false);
      }
    },
    [onInsert],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-border bg-muted/30 hover:border-accent/50 hover:bg-muted/50',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        ) : isDragging ? (
          <Upload className="h-8 w-8 text-accent" />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium">
          {uploading ? 'Subiendo imagen...' : 'Arrastra imágenes aquí'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          o haz clic para seleccionar · JPG, PNG, GIF, WebP · máx. 5 MB
        </p>
        <p className="mt-2 text-xs text-accent">
          Se insertará automáticamente en el contenido Markdown
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
    </div>
  );
}
